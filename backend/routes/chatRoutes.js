const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/messages/:user', async (req, res) => {
  const { user } = req.params;

  try {
    const messages = await Message.find({ recipient: user }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving messages', error });
  }
});

router.post('/messages', async (req, res) => {
  const { sender, recipient, message } = req.body;

  try {
    const chatMessage = new Message({ sender, recipient, message, timestamp: new Date() });
    await chatMessage.save();
    res.status(201).json({ message: 'Message sent successfully', chatMessage });
  } catch (error) {
    res.status(400).json({ message: 'Error sending message', error });
  }
});

module.exports = router;
