const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter specifically for recovery endpoint to prevent abuse
const recoveryLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, // limit each IP to 5 requests per windowMs
	message: { error: 'Demasiadas solicitudes de recuperación. Intenta de nuevo más tarde.' }
});

router.post('/register', authController.uploadMiddleware, authController.registerUser);
router.post('/login', authController.login);
router.post('/recovery', recoveryLimiter, authController.sendRecoveryCode);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
