// How to excecute?
// npx prisma db seed

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("12345", 12);
  const user = await prisma.users.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password,
      role: "admin",
    },
  });
  console.log({ user });
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
