// src/services/socket.js
import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = (token, userId) => {
  // Si ya existe una conexión activa, reutilízala
  if (socketInstance && socketInstance.connected) {
    console.log("🔁 Usando conexión existente de Socket.IO");
    return socketInstance;
  }

  // Si hay una conexión inactiva, elimínala
  if (socketInstance) {
    console.warn("🧹 Cerrando conexión anterior de Socket.IO");
    socketInstance.offAny();
    socketInstance.disconnect();
    socketInstance = null;
  }

  // Crear nueva conexión
  socketInstance = io(
    process.env.REACT_APP_API_URL || "http://localhost:5000",
    {
      auth: { token },
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
      transports: ["websocket"],
      autoConnect: true,
    }
  );

  socketInstance.on("connect_error", (error) => {
    console.error("❌ Error de conexión Socket.IO:", error.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("🔌 Socket desconectado:", reason);
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("🔌 Conexión de Socket.IO cerrada manualmente");
  }
};
