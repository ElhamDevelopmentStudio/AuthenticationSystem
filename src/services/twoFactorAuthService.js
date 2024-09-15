const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../config/prisma');

exports.generateSecret = (email) => {
  return speakeasy.generateSecret({
    name: `Your App (${email})`
  });
};

exports.generateQRCode = async (otpauthUrl) => {
  return QRCode.toDataURL(otpauthUrl);
};

exports.verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token
  });
};

exports.enableTwoFactorAuth = async (userId, secret) => {
  await prisma.twoFactorAuth.upsert({
    where: { userId },
    update: { secretKey: secret.base32, isEnabled: true },
    create: { userId, secretKey: secret.base32, isEnabled: true }
  });
};

exports.disableTwoFactorAuth = async (userId) => {
  await prisma.twoFactorAuth.update({
    where: { userId },
    data: { isEnabled: false }
  });
};

exports.getTwoFactorAuthStatus = async (userId) => {
  const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
    where: { userId }
  });
  return twoFactorAuth ? twoFactorAuth.isEnabled : false;
};