import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a room for a specific session
    socket.on("join-session", (sessionId) => {
      if (sessionId) {
        socket.join(`session-${sessionId}`);
        console.log(`Client ${socket.id} joined session-${sessionId}`);
      }
    });

    socket.on("leave-session", (sessionId) => {
      if (sessionId) {
        socket.leave(`session-${sessionId}`);
        console.log(`Client ${socket.id} left session-${sessionId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 Socket.io initialized");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized.");
  }
  return io;
};

/**
 * Emit an event to a specific session room.
 *
 * @param {string} sessionId
 * @param {string} event
 * @param {object} data
 */
export const emitToSession = (sessionId, event, data) => {
  if (!io) {
    console.warn("⚠️ Socket.io not initialized, cannot emit event:", event);
    return;
  }
  io.to(`session-${sessionId}`).emit(event, data);
};
