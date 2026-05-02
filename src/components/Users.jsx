import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { ChatContext } from "../context/ChatContext.jsx";

const Users = () => {
    const lightTheme = useSelector((state) => state.themeKey);
    const { backendUrl, refresh, setRefresh } = useContext(ChatContext);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(backendUrl + "/api/user/fetchUsers");
                if (response.data.success) {
                    setUsers(response.data.users);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchUsers();
    }, [refresh]);

    const startChat = async (user) => {
        try {
            const response = await axios.post(backendUrl + "/api/chat/", { userId: user._id });
            if (response.data.success) {
                const chat = response.data.chat;
                setRefresh(!refresh);
                // FIX BUG 2: navigate with correct chatId & userName
                navigate(`/app/chat/${chat._id}&${user.name}`);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className={`list-container${lightTheme ? "" : " dark"}`}
            >
                <div className={`list-header${lightTheme ? "" : " dark"}`}>
                    <p className={`list-title${lightTheme ? "" : " dark"}`}>Available Users</p>
                    <button className={`sb-icon-btn${lightTheme ? "" : " dark"}`} onClick={() => setRefresh(!refresh)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                    </button>
                </div>

                <div className={`list-search${lightTheme ? "" : " dark"}`}>
                    <div className={`search-input-wrap${lightTheme ? "" : " dark"}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className={`search-box${lightTheme ? "" : " dark"}`} placeholder="Search users" />
                    </div>
                </div>

                <div className="list-items">
                    {users.map((user, index) => (
                        <motion.div
                            key={user._id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`list-item${lightTheme ? "" : " dark"}`}
                            onClick={() => startChat(user)}
                        >
                            <div className="convo-avatar" style={{ width: 38, height: 38, fontSize: "0.9rem" }}>
                                {user.name[0].toUpperCase()}
                            </div>
                            <p className={`list-item-name${lightTheme ? "" : " dark"}`}>{user.name}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Users;
