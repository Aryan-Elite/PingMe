const http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const { Server } = require('socket.io');
const connectDB = require('./db.js');
const setupChat = require('./socket/chat.js');
const setupNotifications = require('./socket/notifications.js');
const authRoute = require('./routes/auth.js');

const app = express();
const server = http.createServer(app); // wrap express in raw http server so Socket.io can attach
const io = new Server(server);         // attach Socket.io to the http server

app.use(express.json()); // parse incoming JSON request bodies

// activate /chat namespace — handles 1-on-1 messaging between users
setupChat(io);
// activate /notifications namespace — per-user channel for real-time alerts
setupNotifications(io);

// routes
app.get('/', (req, res) => res.json('Health is good'));
app.use('/auth', authRoute);

// connect to MongoDB first, then start server
connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on PORT ${process.env.PORT}`);
    });
  })
  .catch(error => console.log(error));
