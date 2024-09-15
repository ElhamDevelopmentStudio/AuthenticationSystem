const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class User {
  static async create(userData) {
    // Create a user
    const newUser = await prisma.user.create({
      data: userData,
    });
    return newUser;
  }

  static async findByEmail(email) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  static async findById(id) {
    // Find user by id
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  }
}

module.exports = User;
