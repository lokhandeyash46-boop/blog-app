const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { registerRules, loginRules, handleValidation } = require('../middleware/validate');

router.get('/register', authController.renderRegister);
router.post('/register', registerRules, handleValidation('auth/register'), authController.register);

router.get('/login', authController.renderLogin);
router.post('/login', loginRules, handleValidation('auth/login'), authController.login);

router.post('/logout', authController.logout);

module.exports = router;
