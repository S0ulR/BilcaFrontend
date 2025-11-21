// src/services/socket.js
import { io } from "socket.io-client";

let socketInstance = null;

// ✅ Determinar la URL del servidor de sockets según el entorno
const getSocketURL = () => {
  if (process.env.NODE_ENV === "development") {
    // Asegúrate de que esta URL coincida con el puerto donde corre tu backend en desarrollo
    return process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
  }
  // En producción, si el socket corre en el mismo dominio que tu frontend, puedes usar ''
  // Si corre en otro dominio/puerto, debes usar la URL completa
  return process.env.REACT_APP_SOCKET_URL || ""; // '' significa mismo dominio/origen
};

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

  // ✅ Usar la URL dinámica para la conexión
  const socketURL = getSocketURL();

  socketInstance = io(socketURL, {
    auth: { token },
    query: { userId },
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 5000,
    transports: ["websocket"],
    autoConnect: true,
  });

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
