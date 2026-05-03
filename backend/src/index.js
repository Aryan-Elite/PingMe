const http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./db.js');
const setupChat = require('./socket/chat.js');
const setupNotifications = require('./socket/notifications.js');
const authRoute = require('./routes/auth.js');
const chatRoute = require('./routes/chat.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// activate /chat namespace — handles 1-on-1 messaging between users
setupChat(io);
// activate /notifications namespace — per-user channel for real-time alerts
setupNotifications(io);

// routes
app.get('/', (req, res) => res.json('Health is good - CI/CD works!'));
app.use('/auth', authRoute);
app.use('/chat', chatRoute); // room creation + message history

// connect to MongoDB first, then start server
connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on PORT ${process.env.PORT}`);
    });
  })
  .catch(error => console.log(error));
