const Room = require('../models/Room');
const Message = require('../models/Message');

// create a room between two users
const createRoom = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.userId; // from JWT middleware

    // check if room already exists between these two users
    const existingRoom = await Room.findOne({
      participants: { $all: [userId, participantId] }
    });
    if (existingRoom) return res.status(200).json(existingRoom);

    const room = await Room.create({ participants: [userId, participantId] });
    res.status(201).json(room);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error creating room');
  }
};

// fetch message history for a room
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    // uses index on { roomId, createdAt } — fast query
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error fetching messages');
  }
};

module.exports = { createRoom, getMessages };
