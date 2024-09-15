const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const jwtService = require('../services/jwtService');
const { createRefreshToken, deleteRefreshToken } = require('../services/tokenService');
const { generateVerificationToken } = require('../services/verificationTokenService');
const { sendVerificationEmail } = require('../services/emailService');
const { verifyToken } = require('../services/verificationTokenService');
const twoFactorAuthService = require('../services/twoFactorAuthService');
const { enableEmailVerification } = require('../config/emailVerficationAccess'); 

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      verified: !enableEmailVerification,
    });

    if (enableEmailVerification) {
      const verificationToken = await generateVerificationToken(newUser.id);
      await sendVerificationEmail(newUser, verificationToken);
      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        userId: newUser.id
      });
    } else {
      res.status(201).json({
        message: 'User registered successfully without email verification.',
        userId: newUser.id
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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


exports.login = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email verification is required and if the user is verified
    if (enableEmailVerification && !user.verified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const is2FAEnabled = await twoFactorAuthService.getTwoFactorAuthStatus(user.id);

    if (is2FAEnabled) {
      if (!twoFactorToken) {
        return res.status(403).json({ message: '2FA token required', require2FA: true });
      }

      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId: user.id }
      });

      const isValid = twoFactorAuthService.verifyToken({ base32: twoFactorAuth.secretKey }, twoFactorToken);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid 2FA token' });
      }
    }

    const accessToken = jwtService.generateAccessToken(user.id, user.roles);
    const refreshToken = jwtService.generateRefreshToken(user.id);
    await createRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles
      },
      "verified": user.verified
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.refreshToken = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { refreshToken } = req.body;
    console.log('Received refresh token:', refreshToken);
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    console.log('Decoded refresh token:', decoded);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = jwtService.generateAccessToken(user.id, user.roles);
    const newRefreshToken = jwtService.generateRefreshToken(user.id);

    await deleteRefreshToken(refreshToken);
    await createRefreshToken(user.id, newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await deleteRefreshToken(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
