const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

exports.generateResetToken = async (userId) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRES_IN) * 60 * 1000
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: expiresAt,
    },
  });

  return resetToken;
};

exports.verifyResetToken = async (resetToken) => {
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  return user;
};

exports.resetPassword = async (userId, newPassword) => {
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
};
