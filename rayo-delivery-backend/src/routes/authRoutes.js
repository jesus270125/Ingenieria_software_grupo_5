const express = require('express');
const router = express.Router();
const {
    registerUser,
    login,
    sendRecoveryCode,
    resetPassword
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', login);
router.post('/recovery', sendRecoveryCode);
router.post('/reset-password', resetPassword);

module.exports = router;
