import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../features/themeSlice.js";
import { ChatContext } from "../context/ChatContext.jsx";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const lightTheme = useSelector((state) => state.themeKey);
  const { chats, logout, userData, refresh, setRefresh } =
    useContext(ChatContext);

  return (
    <div className={`sidebar-container${lightTheme ? "" : " dark"}`}>
      {/* ── Header ── */}
      <div className={`sb-header${lightTheme ? "" : " dark"}`}>
        <span className="sb-logo">LiveChat</span>
        <div className="sb-icons">
          <button
            className={`sb-icon-btn${lightTheme ? "" : " dark"}`}
            onClick={() => navigate("/app/users")}
            title="Find Users"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            className={`sb-icon-btn${lightTheme ? "" : " dark"}`}
            onClick={() => navigate("/app/groups")}
            title="Groups"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
          <button
            className={`sb-icon-btn${lightTheme ? "" : " dark"}`}
            onClick={() => navigate("/app/create-groups")}
            title="Create Group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          <button
            className={`sb-icon-btn${lightTheme ? "" : " dark"}`}
            onClick={() => dispatch(toggleTheme())}
            title="Toggle Theme"
          >
            {lightTheme ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={`sb-search${lightTheme ? "" : " dark"}`}>
        <div className={`search-input-wrap${lightTheme ? "" : " dark"}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={`search-box${lightTheme ? "" : " dark"}`}
            placeholder="Search conversations"
          />
        </div>
      </div>

      {/* ── Conversations ── */}
      <div className={`sb-conversations${lightTheme ? "" : " dark"}`}>
        {chats.map((conversation, index) => {
          if (!conversation.users || conversation.users.length === 0)
            return null;

          const isGroup = conversation.isGroupChat;
          const displayName = isGroup
            ? conversation.chatName
            : (
                conversation.users.find(
                  (u) => u._id.toString() !== userData?._id.toString(),
                ) || conversation.users[0]
              )?.name || "Unknown";
          const displayInitial = displayName?.[0]?.toUpperCase() || "?";
          const lastMsg =
            conversation.latestMessage?.content || "Start a conversation";

          return (
            <div
              key={conversation._id || index}
              className={`convo-item${lightTheme ? "" : " dark"}`}
              onClick={() => {
                setRefresh(!refresh);
                navigate(`/app/chat/${conversation._id}&${displayName}`);
              }}
            >
              <div
                className="convo-avatar"
                style={{ background: isGroup ? "#6c63ff" : "var(--accent)" }}
              >
                {displayInitial}
              </div>
              <div className="convo-info">
                <p className={`convo-name${lightTheme ? "" : " dark"}`}>
                  {displayName}
                </p>
                <p className={`convo-last${lightTheme ? "" : " dark"}`}>
                  {lastMsg}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Logout — pinned to bottom via sb-logout class ── */}
      <div className={`sb-logout${lightTheme ? "" : " dark"}`}>
        <button
          onClick={logout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            cursor: "pointer",
            color: lightTheme ? "var(--light-muted)" : "var(--dark-muted)",
            fontSize: "0.875rem",
            fontWeight: 500,
            fontFamily: "DM Sans, sans-serif",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = lightTheme
              ? "var(--light-border)"
              : "var(--dark-border)";
            e.currentTarget.style.color = lightTheme
              ? "var(--light-text)"
              : "var(--dark-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = lightTheme
              ? "var(--light-muted)"
              : "var(--dark-muted)";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="logout-label">Logout, {userData?.name ? `${userData.name}` : ""}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
