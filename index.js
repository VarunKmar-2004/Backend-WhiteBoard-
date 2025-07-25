import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import http from 'http';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello world');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
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
    io.to(roomName).emit('draw', drawData);
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

  // Relay offer to target peer
  socket.on('webrtc_offer', ({ targetSocketId, offer, drawerName }) => {
    io.to(targetSocketId).emit('webrtc_offer', {
      fromSocketId: socket.id,
      offer,
      drawerName
    });
  });

  // Relay answer to offerer
  socket.on('webrtc_answer', ({ targetSocketId, answer, drawerName }) => {
    io.to(targetSocketId).emit('webrtc_answer', {
      fromSocketId: socket.id,
      answer,
      drawerName
    });
  });

  // Relay ICE candidate
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

server.listen(5000,'0.0.0.0', () => {
  console.log('Server is running');
});
