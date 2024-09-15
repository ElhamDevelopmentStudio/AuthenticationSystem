const jwtService = require('../services/jwtService');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    const user = jwtService.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: "Access denied" });
    }

    const hasAllowedRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};