const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const helmet = require("helmet");
const {
  loginLimiter,
  generalLimiter,
} = require("./middlewares/rateLimitMiddleware");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(generalLimiter);

// Routes
const authRoutes = require("./routes/authRoute");
app.use("/api/auth", authRoutes);

const twoFactorAuthRoutes = require("./routes/twoFactorAuthRoute");
app.use("/api/2fa", twoFactorAuthRoutes);

const passwordResetRoutes = require("./routes/passwordResetRoute");
app.use("/api/password", passwordResetRoutes);

// Apply login limiter specifically to the login route
app.use("/api/auth/login", loginLimiter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
