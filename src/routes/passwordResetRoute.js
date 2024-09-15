const express = require("express");
const { body } = require("express-validator");
const passwordResetController = require("../controllers/passwordResetController");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

router.post(
  "/request-reset",
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  passwordResetController.requestPasswordReset
);

router.post(
  "/reset",
  [
    body("token").isString().notEmpty(),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
      .withMessage(
        "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  ],
  validateRequest,
  passwordResetController.resetPassword
);

module.exports = router;
