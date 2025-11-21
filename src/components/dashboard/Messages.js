// src/components/dashboard/Messages.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import Breadcrumb from "../ui/Breadcrumb";
import { getSocket } from "../../services/socket";
import "./Messages.css";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const initialized = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Validación y carga inicial
  useEffect(() => {
    if (!user || !user._id) {
      window.location.href = "/login";
      return;
    }

    if (!isLoaded) {
      loadConversations();
      setIsLoaded(true);
    }
  }, [user, isLoaded]);

  // Inicializar Socket.IO
  useEffect(() => {
    if (!user?._id || initialized.current) return;

    initialized.current = true;
    const token = sessionStorage.getItem("token"); // ✅ Cambiado a sessionStorage
    const socket = getSocket(token, user._id);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket conectado:", socket.id);
      socket.emit("join", user._id);
    });

    socket.on("new_message", (message) => {
      if (message.conversation?.toString() === selected) {
        setMessages((prev) => [...prev, message]);
        markAsReadLocally(message.conversation);
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === message.conversation
            ? { ...conv, lastMessage: message, updatedAt: Date.now() }
            : conv
        )
      );
    });

    socket.on("message_read", ({ messageId, conversationId }) => {
      if (conversationId === selected) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, read: true } : msg
          )
        );
      }
    });

    socket.on("user_typing", (data) => {
      if (data.conversationId === selected && data.userId !== user._id) {
        setTypingUser(data.userName);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });

    socket.on("user_stopped_typing", ({ conversationId }) => {
      if (conversationId === selected) {
        setTypingUser(null);
      }
    });

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("new_message");
        socket.off("message_read");
        socket.off("user_typing");
        socket.off("user_stopped_typing");
        socket.close();
      }
    };
  }, [user]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Evento de "escribiendo"
  useEffect(() => {
    if (!socketRef.current || !selected || !newMessage.trim()) return;

    socketRef.current.emit("typing", {
      conversationId: selected,
      userId: user._id,
      userName: user.name,
    });

    const timeout = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { conversationId: selected });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [newMessage, selected, user]);

  const loadConversations = async () => {
    try {
      const res = await API.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("No se pudieron cargar las conversaciones", err);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const res = await API.get(`/messages/${convId}`);
      setMessages(res.data);
      setSelected(convId);
      markAsRead(convId);
    } catch (err) {
      console.error("Error al cargar mensajes", err);
      setMessages([]);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await API.put(`/messages/${convId}/read`);
      markAsReadLocally(convId);
    } catch (err) {
      console.error("No se pudo marcar como leído", err);
    }
  };

  const markAsReadLocally = (convId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === convId
          ? {
              ...c,
              lastMessage: c.lastMessage ? { ...c.lastMessage, read: true } : null,
            }
          : c
      )
    );
  };

  // Subida de archivo
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      alert("Solo se permiten imágenes (JPG, PNG, WEBP) y PDFs.");
      e.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      alert("El archivo es demasiado grande. Máximo 10 MB.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversation", selected);

    setUploading(true);
    try {
      await API.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.error("Error al subir archivo", err);
      alert("No se pudo subir el archivo.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Limpiar input
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selected) return;

    setLoading(true);
    try {
      const conversation = conversations.find((c) => c._id === selected);
      const recipient = conversation?.participants.find((p) => p._id !== user._id);

      if (!recipient) {
        console.error("Destinatario no encontrado");
        return;
      }

      const res = await API.post("/messages/send", {
        recipient: recipient._id,
        content: newMessage,
      });

      const sentMessage = {
        ...res.data,
        sender: { _id: user._id, name: user.name },
        read: false,
      };

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");

      socketRef.current?.emit("message_read", {
        messageId: sentMessage._id,
        conversationId: selected,
      });
    } catch (err) {
      console.error("Error al enviar mensaje:", err.response?.data || err.message);
      alert("No se pudo enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  };

  const otherUser = selected
    ? conversations
        .find((c) => c._id === selected)
        ?.participants.find((p) => p._id !== user._id)
    : null;

  return (
    <div className="chat-container">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Mensajes", active: true },
        ]}
      />

      {/* Encabezado */}
      <div className="welcome-card">
        <h1>Chat</h1>
        <p>Comunícate directamente con clientes o trabajadores.</p>
      </div>

      <div className="chat-layout">
        {/* Sidebar: Conversaciones */}
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>
              <i className="fas fa-comments"></i> Conversaciones
            </h3>
          </div>
          <div className="chat-conversations">
            {conversations.length === 0 ? (
              <p className="no-conversations">
                <i className="fas fa-comments"></i>
                <br />Aún no tienes conversaciones
              </p>
            ) : (
              conversations.map((conv) => {
                const other = conv.participants.find((p) => p._id !== user._id);
                const lastMsg = conv.lastMessage?.content || "Sin mensajes";
                const isUnread =
                  conv.lastMessage?.sender !== user._id && !conv.lastMessage?.read;

                return (
                  <div
                    key={conv._id}
                    className={`chat-conversation ${selected === conv._id ? "active" : ""} ${
                      isUnread ? "unread" : ""
                    }`}
                    onClick={() => loadMessages(conv._id)}
                  >
                    <div className="avatar">
                      <img
                        src={other?.photo || "/assets/default-avatar.png"}
                        alt={other?.name}
                        onError={(e) => (e.target.src = "/assets/default-avatar.png")}
                      />
                    </div>
                    <div className="conversation-info">
                      <strong>{other?.name || "Usuario"}</strong>
                      <p>{lastMsg.length > 50 ? `${lastMsg.substring(0, 50)}...` : lastMsg}</p>
                    </div>
                    {isUnread && <div className="dot"></div>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat principal */}
        <div className="chat-main">
          {selected ? (
            <>
              <div className="chat-header">
                <div className="chat-with">
                  <img
                    src={otherUser?.photo || "/assets/default-avatar.png"}
                    alt={otherUser?.name}
                    onError={(e) => (e.target.src = "/assets/default-avatar.png")}
                  />
                  <div>
                    <strong>{otherUser?.name}</strong>
                    <small>En línea</small>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {typingUser && (
                  <div className="typing-indicator">
                    <i className="fas fa-comment-dots"></i> {typingUser} está escribiendo...
                  </div>
                )}

                {messages.length === 0 ? (
                  <p className="no-messages">Aún no hay mensajes en esta conversación.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message ${msg.sender._id === user._id ? "sent" : "received"}`}
                    >
                      <div className="message-content">
                        {/* Previsualización de imagen o enlace de archivo */}
                        {msg.file ? (
                          msg.file.type === "image" ? (
                            <div className="file-preview">
                              <a
                                href={`${API_BASE}/api/messages/file/${msg._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={`${API_BASE}/api/messages/file/${msg._id}`}
                                  alt={msg.file.name}
                                  style={{
                                    maxWidth: "200px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                  }}
                                />
                              </a>
                              <span className="file-name">{msg.file.name}</span>
                            </div>
                          ) : (
                            <div className="file-attachment">
                              <a
                                href={`${API_BASE}/api/messages/file/${msg._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Abrir ${msg.file.name}`}
                              >
                                <i className="fas fa-file-pdf"></i>
                                <span>{msg.file.name}</span>
                              </a>
                            </div>
                          )
                        ) : (
                          <p>{msg.content}</p>
                        )}

                        <span className="timestamp">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.sender._id === user._id && (
                            <i
                              className={`ml-1 fas ${
                                msg.read ? "fa-check-double" : "fa-check"
                              }`}
                              style={{ color: msg.read ? "#4a9d9c" : "#ccc" }}
                            ></i>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="chat-input">
                <label className="file-upload">
                  <i className="fas fa-paperclip"></i>
                  <input type="file" onChange={handleFileUpload} disabled={uploading} />
                </label>
                <input
                  type="text"
                  placeholder={uploading ? "Subiendo..." : "Escribe un mensaje..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading || uploading}
                />
                <button type="submit" disabled={loading || uploading}>
                  {loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <i className="fas fa-comments fa-3x" style={{ color: "#ccc" }}></i>
              <h4>Selecciona una conversación</h4>
              <p>Para comenzar a chatear, selecciona una conversación de la izquierda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Messages);
