import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { ChatContext } from "../context/ChatContext.jsx";
import { CallContext } from "../context/CallContext.jsx";
import MessageSelf from "./MessageSelf.jsx";
import MessageOthers from "./MessageOthers.jsx";

let socket;

const ChatArea = () => {
  const lightTheme = useSelector((state) => state.themeKey);
  const { _id } = useParams();
  const [chat_id, chat_user] = _id.split("&");
  const navigate = useNavigate();

  const { userData, refresh, setRefresh, backendUrl } = useContext(ChatContext);
  const { startCall } = useContext(CallContext);

  const [messageContent, setMessageContent] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [receiverSocketId, setReceiverSocketId] = useState(null);
  const [otherUserId, setOtherUserId] = useState(null);
  const messagesEndRef = useRef(null);

  // ── Fetch messages ──
  const fetchMessages = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/message/" + chat_id);
      if (response.data.success) {
        setAllMessages(response.data.messages);
        setLoaded(true);
        socket.emit("join chat", chat_id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ── Check if group chat + get other user ID ──
  const fetchChatInfo = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/chat/");
      if (response.data.success) {
        const currentChat = response.data.chats.find((c) => c._id === chat_id);
        if (currentChat) {
          setIsGroupChat(currentChat.isGroupChat);
          if (!currentChat.isGroupChat) {
            const other = currentChat.users.find(
              (u) => u._id.toString() !== userData?._id.toString()
            );
            if (other) setOtherUserId(other._id.toString());
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ── Get receiver socket ID when otherUserId is known ──
  useEffect(() => {
    if (!socket || !otherUserId) return;
    socket.emit("get-socket-id", otherUserId, (socketId) => {
      setReceiverSocketId(socketId);
    });
  }, [otherUserId, socketConnected]);

  // ── Leave group ──
  const leaveGroup = async () => {
    try {
      const response = await axios.put(backendUrl + "/api/chat/groupExit", {
        chatId: chat_id,
        userId: userData?._id,
      });
      if (response.data.success) {
        toast.success("Left the group");
        setRefresh(!refresh);
        navigate("/app/welcome");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // ── Send message ──
  const sendMessage = async () => {
    if (!messageContent.trim()) return;
    try {
      const response = await axios.post(backendUrl + "/api/message/", {
        content: messageContent,
        chatId: chat_id,
      });
      if (response.data.success) {
        const newMessage = response.data.message;
        socket.emit("new message", newMessage);
        setAllMessages((prev) => [...prev, newMessage]);
        setMessageContent("");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ── Setup socket ──
  useEffect(() => {
    socket = io(backendUrl);
    socket.emit("setup", userData);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => { socket.disconnect(); };
  }, []);

  // ── Listen for new messages ──
  useEffect(() => {
    if (!socket) return;
    socket.on("message received", (newMessage) => {
      if (newMessage.chat._id === chat_id) {
        setAllMessages((prev) => [...prev, newMessage]);
        setRefresh((prev) => !prev);
      } else {
        setRefresh((prev) => !prev);
      }
    });
    return () => { socket.off("message received"); };
  }, [chat_id]);

  // ── Fetch on chat change ──
  useEffect(() => {
    setLoaded(false);
    fetchMessages();
    fetchChatInfo();
  }, [chat_id]);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // ── Typing indicator ──
  const handleTyping = (e) => {
    setMessageContent(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", chat_id);
    }
    const lastTypingTime = new Date().getTime();
    setTimeout(() => {
      const timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= 2000 && typing) {
        socket.emit("stop typing", chat_id);
        setTyping(false);
      }
    }, 2000);
  };

  if (!userData) {
    return (
      <div className={`chatArea-container${lightTheme ? "" : " dark"}`} style={{ gap: 16, padding: 20 }}>
        <div className="skeleton" style={{ height: 60, width: "100%" }} />
        <div className="skeleton" style={{ flex: 1, width: "100%" }} />
        <div className="skeleton" style={{ height: 56, width: "100%" }} />
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className={`chatArea-container${lightTheme ? "" : " dark"}`} style={{ gap: 16, padding: 20 }}>
        <div className="skeleton" style={{ height: 60, width: "100%" }} />
        <div className="skeleton" style={{ flex: 1, width: "100%" }} />
        <div className="skeleton" style={{ height: 56, width: "100%" }} />
      </div>
    );
  }

  return (
    <div className={`chatArea-container${lightTheme ? "" : " dark"}`}>

      {/* ── Header ── */}
      <div className={`chatArea-header${lightTheme ? "" : " dark"}`}>
        <div className="convo-avatar" style={{
          width: 38, height: 38, fontSize: "0.9rem",
          background: isGroupChat ? "#6c63ff" : "var(--accent)",
        }}>
          {chat_user[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p className={`chat-header-name${lightTheme ? "" : " dark"}`}>{chat_user}</p>
          {isTyping && (
            <p style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: 2 }}>
              typing...
            </p>
          )}
        </div>

        {/* ── Call Buttons — only for direct chats ── */}
        {!isGroupChat && (
          <div style={{ display: "flex", gap: 8, marginRight: 12 }}>
            <button
              onClick={() => {
                if (!receiverSocketId) {
                  toast.error("User is offline");
                  return;
                }
                startCall(receiverSocketId, chat_user, "voice", chat_id);
              }}
              title="Voice Call"
              style={callBtnStyle(lightTheme)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
            <button
              onClick={() => {
                if (!receiverSocketId) {
                  toast.error("User is offline");
                  return;
                }
                startCall(receiverSocketId, chat_user, "video", chat_id);
              }}
              title="Video Call"
              style={callBtnStyle(lightTheme)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </button>
          </div>
        )}

        {/* Leave Group button — only for group chats */}
        {isGroupChat && (
          <button
            onClick={leaveGroup}
            title="Leave Group"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", border: "1.5px solid #ff4d4f",
              borderRadius: "8px", background: "transparent",
              color: "#ff4d4f", fontSize: "0.8rem", fontWeight: 500,
              fontFamily: "DM Sans, sans-serif", cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ff4d4f"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ff4d4f"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Leave Group
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="messages-container">
        {allMessages.map((message, index) => {
          if (!message?.sender?._id) return null;
          if (message.sender._id.toString() === userData._id.toString()) {
            return <MessageSelf key={message._id || index} message={message} />;
          } else {
            return <MessageOthers key={message._id || index} message={message} lightTheme={lightTheme} />;
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className={`text-input-area${lightTheme ? "" : " dark"}`}>
        <input
          className={`msg-input${lightTheme ? "" : " dark"}`}
          placeholder="Type a message..."
          value={messageContent}
          onChange={handleTyping}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
        />
        <button className="send-btn" onClick={sendMessage}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

const callBtnStyle = (lightTheme) => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 36, height: 36, borderRadius: "50%", border: "none",
  background: lightTheme ? "#f0f0f0" : "rgba(255,255,255,0.1)",
  color: lightTheme ? "#333" : "#fff",
  cursor: "pointer", transition: "background 0.15s",
});

export default ChatArea;