const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
}));

let rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substring(2, 8);
    rooms[roomCode] = { messages: [], users: [] };
    socket.emit("roomCreated", roomCode);
    socket.join(roomCode);
    rooms[roomCode].users.push(socket.id);
    console.log(`Room ${roomCode} created and joined`);
  });

  socket.on("joinRoom", (roomCode) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { messages: [], users: [] };
    }
    socket.join(roomCode);
    rooms[roomCode].users.push(socket.id);
    console.log(`User joined room ${roomCode}`);
    socket.emit("previousMessages", rooms[roomCode].messages);
  });

  socket.on("sendMessage", (data) => {
    const { roomCode, message, sender } = data;
    console.log(`Message received in room ${roomCode}: ${sender}: ${message}`);

    if (rooms[roomCode]) {
      const newMessage = { sender, message };
      rooms[roomCode].messages.push(newMessage);
      io.to(roomCode).emit("receiveMessage", newMessage);
      console.log("Message broadcasted to room:", roomCode);
    }
  });

  socket.on("disconnect", () => {
    for (let roomCode in rooms) {
      const index = rooms[roomCode].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[roomCode].users.splice(index, 1);
        console.log(`User disconnected from room ${roomCode}`);
        break;
      }
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
