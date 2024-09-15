const {
  generateResetToken,
  verifyResetToken,
  resetPassword,
} = require("../services/passwordResetService");
const { sendPasswordResetEmail } = require("../services/emailService");
const userModel = require("../models/userModel");

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = await generateResetToken(user.id);
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await verifyResetToken(token);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    await resetPassword(user.id, newPassword);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
