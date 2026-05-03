const { Router } = require('express');
const { createRoom, getMessages } = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');

const router = Router();

// protected routes — JWT required
router.post('/room', protect, createRoom);
router.get('/room/:roomId/messages', protect, getMessages);

module.exports = router;
