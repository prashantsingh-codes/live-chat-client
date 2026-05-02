import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ChatContext } from "../context/ChatContext.jsx";

const Welcome = () => {
    const lightTheme = useSelector((state) => state.themeKey);
    const { userData } = useContext(ChatContext);

    return (
        <div className={`welcome-container${lightTheme ? "" : " dark"}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
                <div style={{
                    width: 72,
                    height: 72,
                    background: "var(--accent)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 800,
                    color: "white"
                }}>
                    {userData?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <p className={`welcome-title${lightTheme ? "" : " dark"}`}>
                    Hey, {userData?.name} 👋
                </p>
                <p className="welcome-sub">
                    Select a conversation or find a user to start chatting
                </p>
            </motion.div>
        </div>
    );
};

export default Welcome;
