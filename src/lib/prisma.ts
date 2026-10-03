import { PrismaClient } from "@prisma/client";
import path from "path";
import { initUserDatabase, verifySessionToken } from "./auth";

const clientsPool = new Map<string, PrismaClient>();

function getClientForUser(username: string): PrismaClient {
  const safeUser = (username || "sajjad").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

  if (!clientsPool.has(safeUser)) {
    initUserDatabase(safeUser);
    const dbPath = path.resolve("prisma", "users", `${safeUser}.db`);
    const dbUrl = `file:${dbPath}`;
    const client = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ["error"],
    });
    clientsPool.set(safeUser, client);
  }

  return clientsPool.get(safeUser)!;
}

export function getCurrentUsername(): string {
  try {
    const { cookies } = require("next/headers");
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("life_os_session")?.value;
    if (sessionToken) {
      const user = verifySessionToken(sessionToken);
      if (user) return user;
    }
  } catch {
    // Outside request context (e.g. build time, script, static generation)
  }
  return "sajjad";
}

export function getPrismaClient(user?: string): PrismaClient {
  const u = user || getCurrentUsername();
  return getClientForUser(u);
}

// Proxy that forwards every property/method access to the active user's client
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export default prisma;
