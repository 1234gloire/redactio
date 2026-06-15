import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCallback);
const VALID_ROLES = new Set([
  "praticien",
  "editeur_medical",
  "relecteur_clinique",
  "responsable_conformite",
  "admin",
]);

function getArg(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const databaseUrl = process.env.DATABASE_URL;
const email = getArg("email")?.trim().toLowerCase();
const password = getArg("password");
const name = getArg("name")?.trim() || email;
const role = getArg("role")?.trim() || "praticien";

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (!email || !email.includes("@")) {
  console.error("Usage: pnpm user:create -- --email user@example.com --password secret [--name Name] [--role praticien]");
  process.exit(1);
}

if (!password || password.length < 4) {
  console.error("Password must be at least 4 characters.");
  process.exit(1);
}

if (!VALID_ROLES.has(role)) {
  console.error(`Invalid role "${role}". Valid roles: ${Array.from(VALID_ROLES).join(", ")}`);
  process.exit(1);
}

const openId = `local:${email}`;
const passwordHash = await hashPassword(password);
const connection = await mysql.createConnection(databaseUrl);

try {
  await connection.execute(
    `INSERT INTO users
      (openId, email, name, passwordHash, passwordUpdatedAt, loginMethod, role, lastSignedIn)
    VALUES
      (?, ?, ?, ?, NOW(), 'password', ?, NOW())
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      name = VALUES(name),
      passwordHash = VALUES(passwordHash),
      passwordUpdatedAt = NOW(),
      loginMethod = 'password',
      role = VALUES(role)`,
    [openId, email, name, passwordHash, role]
  );

  console.log(`User ${email} saved with role ${role}.`);
} finally {
  await connection.end();
}
