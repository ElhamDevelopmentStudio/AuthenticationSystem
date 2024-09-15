const prisma = require('../config/prisma');

exports.createRefreshToken = async (userId, token) => {
  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
};

exports.deleteRefreshToken = async (token) => {
  return prisma.refreshToken.delete({
    where: { token }
  });
};

exports.findRefreshToken = async (token) => {
  return prisma.refreshToken.findUnique({
    where: { token }
  });
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await verifyToken(token);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user's verified status
    await User.update(user.id, { verified: true });

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

