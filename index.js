import express from 'express';
import dotenv from 'dotenv'
import { Server } from 'socket.io';
import { connectDB } from './src/lib/db.js';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.js'
import cors from 'cors';
import http from 'http';
dotenv.config()
const app = express();
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:5173',
  'https://white-board-eight-roan.vercel.app'
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};
app.use(cors(corsOptions));
app.get('/', (req, res) => {
  res.send('Hello world');
});
app.use('/api/auth',authRoutes)
const Port=process.env.PORT || 5000
const server = http.createServer(app);
const io = new Server(server, {
  cors:corsOptions,
});

const usersMap = {}; // { socketId: {roomName, drawerName} }
const drawingHistory = {}; // { roomName: [ {from, to, drawerName, socketId}, ... ] }

io.on('connection', (socket) => {
  console.log('user connected:', socket.id);

  // --- Drawing/room logic ---
  socket.on('join_room', ({ roomName, drawerName }) => {
    socket.join(roomName);
    usersMap[socket.id] = { roomName, drawerName };

    // Notify others someone joined
    socket.to(roomName).emit('user_joined', { socketId: socket.id, drawerName });

    // Send all other active users to this client (excluding itself)
    const usersInRoom = Object.entries(usersMap)
      .filter(([id, user]) => user.roomName === roomName && id !== socket.id)
      .map(([id, user]) => ({ socketId: id, drawerName: user.drawerName }));
    socket.emit('active_users', usersInRoom);

    // Send full drawing history to new client for restoring the canvas
    if (drawingHistory[roomName]) {
      drawingHistory[roomName].forEach(drawCommand => {
        socket.emit('draw', drawCommand);
      });
    }
  });

  socket.on('draw', (data) => {
    const user = usersMap[socket.id];
    if (!user) return;
    const roomName = user.roomName;
    const drawData = { ...data, drawerName: user.drawerName, socketId: socket.id };

    // Save to history for this room
    if (!drawingHistory[roomName]) drawingHistory[roomName] = [];
    drawingHistory[roomName].push(drawData);

    // Broadcast to all in room including sender
    socket.to(roomName).emit('draw', drawData);
  });

  socket.on('clear_board', ({ roomName }) => {
    if (drawingHistory[roomName]) drawingHistory[roomName] = [];
    io.to(roomName).emit('clear_board');
  });

  socket.on('cursor_move', ({ position }) => {
    const user = usersMap[socket.id];
    if (!user) return;
    socket.to(user.roomName).emit('cursor_move', {
      position,
      drawerName: user.drawerName,
      socketId: socket.id,
    });
  });

  // --- WebRTC voice chat signaling ---
  socket.on('webrtc_offer', ({ targetSocketId, offer, drawerName }) => {
    io.to(targetSocketId).emit('webrtc_offer', {
      fromSocketId: socket.id,
      offer,
      drawerName
    });
  });

  socket.on('webrtc_answer', ({ targetSocketId, answer, drawerName }) => {
    io.to(targetSocketId).emit('webrtc_answer', {
      fromSocketId: socket.id,
      answer,
      drawerName
    });
  });

  socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('webrtc_ice_candidate', {
      fromSocketId: socket.id,
      candidate
    });
  });

  // --- Disconnect logic ---
  socket.on('disconnect', () => {
    const user = usersMap[socket.id];
    if (user) {
      socket.to(user.roomName).emit('user_left', { socketId: socket.id });
      delete usersMap[socket.id];

      // If room is empty, clear drawing history to free memory
      const stillUsersInRoom = Object.values(usersMap).some(u => u.roomName === user.roomName);
      if (!stillUsersInRoom) {
        delete drawingHistory[user.roomName];
      }
    }
  });
});

server.listen(Port, () => {
  console.log('Server is running');
  connectDB()
});
