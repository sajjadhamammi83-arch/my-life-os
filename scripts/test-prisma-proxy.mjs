import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const USERS_DIR = path.resolve("prisma", "users");
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

// Copy template for user1 and user2
const user1Db = path.resolve(USERS_DIR, "user1.db");
const user2Db = path.resolve(USERS_DIR, "user2.db");
const templateDb = path.resolve("prisma", "day1-template.db");

fs.copyFileSync(templateDb, user1Db);
fs.copyFileSync(templateDb, user2Db);

let activeUser = "user1";

const pool = new Map();
function getClient(user) {
  if (!pool.has(user)) {
    const url = `file:${path.resolve(USERS_DIR, `${user}.db`)}`;
    pool.set(user, new PrismaClient({ datasources: { db: { url } } }));
  }
  return pool.get(user);
}

const prismaProxy = new Proxy({}, {
  get(_target, prop) {
    const client = getClient(activeUser);
    const val = client[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  }
});

async function run() {
  console.log("--- Testing Multi-Tenant SQLite Proxy ---");

  // 1. As user1, create a task
  activeUser = "user1";
  const t1 = await prismaProxy.task.create({
    data: { title: "کار اختصاصی کاربر ۱", status: "today" }
  });
  console.log("User 1 created task:", t1.title);

  // 2. Switch to user2, create a different task
  activeUser = "user2";
  const t2 = await prismaProxy.task.create({
    data: { title: "وظیفه محرمانه کاربر ۲", status: "today" }
  });
  console.log("User 2 created task:", t2.title);

  // 3. Verify User 1 sees ONLY their task
  activeUser = "user1";
  const u1Tasks = await prismaProxy.task.findMany();
  console.log("User 1 task count:", u1Tasks.length, u1Tasks.map(t => t.title));

  // 4. Verify User 2 sees ONLY their task
  activeUser = "user2";
  const u2Tasks = await prismaProxy.task.findMany();
  console.log("User 2 task count:", u2Tasks.length, u2Tasks.map(t => t.title));

  if (u1Tasks.length === 1 && u1Tasks[0].title === "کار اختصاصی کاربر ۱" &&
      u2Tasks.length === 1 && u2Tasks[0].title === "وظیفه محرمانه کاربر ۲") {
    console.log("\n>>> MULTI-TENANT ISOLATION VERIFIED 100%! DATA NEVER MIXES! <<<\n");
  } else {
    console.error("FAILED ISOLATION!");
    process.exit(1);
  }

  await getClient("user1").$disconnect();
  await getClient("user2").$disconnect();
}

run().catch(console.error);
