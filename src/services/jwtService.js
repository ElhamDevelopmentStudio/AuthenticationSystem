const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class JwtService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
  }

  generateAccessToken(userId, roles) {
    return jwt.sign(
      { userId, roles },
      this.accessTokenSecret,
      { expiresIn: '15m', jwtid: uuidv4() }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      this.refreshTokenSecret,
      { expiresIn: '7d', jwtid: uuidv4() }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.accessTokenSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshTokenSecret);
  }
}

module.exports = new JwtService();