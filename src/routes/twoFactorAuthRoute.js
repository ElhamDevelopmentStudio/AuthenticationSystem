const express = require('express');
const { body } = require('express-validator');
const twoFactorAuthController = require('../controllers/twoFactorAuthController');
const validateRequest = require('../middlewares/validateRequest');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/setup', authenticateToken, twoFactorAuthController.setup2FA);
router.post('/enable', 
  authenticateToken, 
  [
    body('token').isString().isLength({ min: 6, max: 6 }),
    body('secret').isString()
  ],
  validateRequest,
  twoFactorAuthController.enable2FA
);
router.post('/disable', authenticateToken, twoFactorAuthController.disable2FA);

module.exports = router;