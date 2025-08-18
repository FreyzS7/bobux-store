const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create users with hashed passwords
  const users = [
    {
      username: "Jiro",
      password: await bcrypt.hash("Shin12345", 10),
      role: "SELLER",
    },
     {
      username: "Mulyadi",
      password: await bcrypt.hash("Shin12345", 10),
      role: "SELLER",
    },
    {
      username: "Ajiz",
      password: await bcrypt.hash("123qwe321", 10),
      role: "MANAGER",
    },

  ];

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { username: user.username },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: user,
      });
      console.log(`Created user: ${user.username} (${user.role})`);
    } else {
      console.log(`User ${user.username} already exists`);
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });