const twoFactorAuthService = require('../services/twoFactorAuthService');
const userModel = require('../models/userModel');

exports.setup2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userModel.findById(userId);

    const secret = twoFactorAuthService.generateSecret(user.email);
    const qrCodeUrl = await twoFactorAuthService.generateQRCode(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCodeUrl: qrCodeUrl
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.enable2FA = async (req, res) => {
  try {
    const { token, secret } = req.body;
    const userId = req.user.userId;

    const isValid = twoFactorAuthService.verifyToken({ base32: secret }, token);

    if (isValid) {
      await twoFactorAuthService.enableTwoFactorAuth(userId, { base32: secret });
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    await twoFactorAuthService.disableTwoFactorAuth(userId);
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
