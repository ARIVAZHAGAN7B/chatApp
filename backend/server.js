require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://chatapp-frontend-z7gm.onrender.com"],
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB Atlas
connectDB();

const users = {}; // { socket.id: username }
const onlineUsers = new Set(); // Store online usernames

// WebSocket logic
io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  socket.on('join', (username) => {
    if (!username.trim()) {
      console.error('❌ Invalid username. Cannot join.');
      return;
    }

    users[socket.id] = username;
    onlineUsers.add(username);

    console.log(`✅ ${username} joined with socket ID: ${socket.id}`);
    io.emit('update_users', Array.from(onlineUsers)); // Broadcast online users
  });

  socket.on('send_message', async (data) => {
    const { to, message } = data;
    const from = users[socket.id];

    if (!from) {
      console.error(`❌ Sender is undefined for socket ID: ${socket.id}`);
      return;
    }

    console.log(`📩 Message from ${from} to ${to}: ${message}`);

    try {
      const chatMessage = new Message({ sender: from, recipient: to, message });
      await chatMessage.save();
      console.log('✅ Message saved successfully.');

      // Send the message to the recipient if they are online
      for (const [id, username] of Object.entries(users)) {
        if (username === to) {
          io.to(id).emit('receive_message', { from, message });
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    const username = users[socket.id];

    if (username) {
      onlineUsers.delete(username);
      io.emit('update_users', Array.from(onlineUsers)); // Update online users
      delete users[socket.id];
    }
  });
});

// ✅ Fetch messages between two users
app.get('/api/chat/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving messages', error });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
