import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

const USERS_FILE = path.resolve("prisma", "users.json");
const USERS_DB_DIR = path.resolve("prisma", "users");
const TEMPLATE_DB = path.resolve("prisma", "day1-template.db");
const SECRET = process.env.AUTH_SECRET || "life-os-super-secure-secret-2026";

function ensureDirs() {
  if (!fs.existsSync(USERS_DB_DIR)) {
    fs.mkdirSync(USERS_DB_DIR, { recursive: true });
  }
}

export function getAllUsers(): AuthUser[] {
  ensureDirs();
  if (!fs.existsSync(USERS_FILE)) {
    // Initialize with default admin user: sajjad / 123456
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword("123456", salt);
    const defaultUsers: AuthUser[] = [
      {
        id: "usr_sajjad",
        username: "sajjad",
        name: "سجاد حمامی",
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), "utf-8");
    initUserDatabase("sajjad");
    return defaultUsers;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function findUser(username: string): AuthUser | null {
  const users = getAllUsers();
  const clean = username.trim().toLowerCase();
  return users.find((u) => u.username.toLowerCase() === clean) || null;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function verifyUser(username: string, password: string): AuthUser | null {
  const user = findUser(username);
  if (!user) return null;

  const computed = hashPassword(password, user.salt);
  if (computed === user.passwordHash) {
    // Ensure database exists
    initUserDatabase(user.username);
    return user;
  }
  return null;
}

export function createUser(username: string, password: string, name: string): AuthUser {
  const users = getAllUsers();
  const clean = username.trim().toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === clean)) {
    throw new Error("این نام کاربری قبلاً ثبت شده است.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const newUser: AuthUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: clean,
    name: name.trim() || clean,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  // Initialize fresh Day 1 database
  initUserDatabase(clean);

  return newUser;
}

/**
 * Initializes physical SQLite database for a user using Day 1 template.
 */
export function initUserDatabase(username: string): string {
  ensureDirs();
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const targetDb = path.resolve(USERS_DB_DIR, `${clean}.db`);

  if (!fs.existsSync(targetDb)) {
    if (fs.existsSync(TEMPLATE_DB)) {
      fs.copyFileSync(TEMPLATE_DB, targetDb);
      console.log(`[Auth] Initialized fresh Day 1 database for user: ${clean}`);
    } else {
      const devDb = path.resolve("prisma", "dev.db");
      if (fs.existsSync(devDb)) {
        fs.copyFileSync(devDb, targetDb);
      }
    }
  }

  return targetDb;
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(username: string): string {
  const clean = username.trim().toLowerCase();
  const payload = {
    u: clean,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const str = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(str).digest("base64url");
  return `${str}.${sig}`;
}

/**
 * Verifies a signed session token and returns the username.
 */
export function verifySessionToken(token: string): string | null {
  if (!token || !token.includes(".")) return null;
  const [str, sig] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(str).digest("base64url");

  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(str, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }
    return payload.u || null;
  } catch {
    return null;
  }
}
