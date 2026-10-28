// Creates (or resets) an administrator account without any default password.
//
// Interactive:      npm run admin:create
// Non-interactive:  ADMIN_EMAIL=you@company.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='…' npm run admin:create
//                   (use only in a trusted shell, e.g. Render's shell; unset the variable afterwards)

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

const db = new PrismaClient();

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      out._writeToOutput = (s: string) => {
        if (s.includes(question)) out.output.write(s);
        else out.output.write("*");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function validPassword(p: string): string | null {
  if (p.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) return "Password must include letters and numbers.";
  return null;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
  const name = process.env.ADMIN_NAME || (await ask("Full name: "));
  if (name.length < 2) throw new Error("Enter a name.");

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await ask("Password (min 12 chars, letters + numbers): ", true);
    const confirm = await ask("Confirm password: ", true);
    if (password !== confirm) throw new Error("Passwords do not match.");
  }
  const problem = validPassword(password);
  if (problem) throw new Error(problem);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN", isActive: true },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({ data: { action: "user.admin_cli", entity: "User", entityId: user.id, summary: "Administrator created/reset via CLI" } });
  console.log(`\nAdministrator ready: ${email}\nSign in at /admin/login`);
}

main()
  .catch((e) => {
    console.error(`\nError: ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
