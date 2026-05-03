const { Router } = require('express');
const authController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/users', protect, authController.getUsers);

module.exports = router;