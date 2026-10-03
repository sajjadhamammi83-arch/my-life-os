import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const TEMPLATE_DB = path.resolve("prisma/day1-template.db");
const USERS_DIR = path.resolve("prisma/users");

if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

// Remove old template if exists
if (fs.existsSync(TEMPLATE_DB)) {
  fs.unlinkSync(TEMPLATE_DB);
}

// Initialize template db using prisma db push / schema
const templateClient = new PrismaClient({
  datasources: {
    db: {
      url: `file:${TEMPLATE_DB}`,
    },
  },
});

async function main() {
  console.log("Creating Day 1 Template Database at:", TEMPLATE_DB);

  // We need the schema pushed to day1-template.db first.
  // Instead of running prisma db push on a different url, we can copy dev.db structure or run schema push.
}

main().catch(console.error);
