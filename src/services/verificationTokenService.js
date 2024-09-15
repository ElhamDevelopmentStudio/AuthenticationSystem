const crypto = require('crypto');
const prisma = require('../config/prisma');

exports.generateVerificationToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
};

exports.verifyToken = async (token) => {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return null;
  }

  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { isEmailVerified: true }
  });

  await prisma.emailVerificationToken.delete({
    where: { id: verificationToken.id }
  });

  return verificationToken.user;
};