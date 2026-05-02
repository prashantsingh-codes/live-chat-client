import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ChatContext } from "../context/ChatContext.jsx";

const Groups = () => {
    const lightTheme = useSelector((state) => state.themeKey);
    const { backendUrl, refresh, setRefresh, userData } = useContext(ChatContext);
    const [groups, setGroups] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get(backendUrl + "/api/chat/fetchGroups");
                if (response.data.success) {
                    setGroups(response.data.groups);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchGroups();
    }, [refresh]);

    const joinGroup = async (group) => {
        try {
            // check if already a member — no toast, just navigate in
            const alreadyMember = group.users?.some(
                u => (u._id || u) === userData?._id
            );

            const response = await axios.post(backendUrl + "/api/chat/joinGroup", {
                chatId: group._id
            });

            if (response.data.success) {
                // only show toast if user was NOT already a member
                if (!alreadyMember) {
                    toast.success(`Joined ${group.chatName}`);
                }
                setRefresh(!refresh);
                navigate(`/app/chat/${group._id}&${group.chatName}`);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
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
                    <p className={`list-title${lightTheme ? "" : " dark"}`}>Available Groups</p>
                    <button
                        className={`sb-icon-btn${lightTheme ? "" : " dark"}`}
                        onClick={() => setRefresh(!refresh)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                    </button>
                </div>

                <div className={`list-search${lightTheme ? "" : " dark"}`}>
                    <div className={`search-input-wrap${lightTheme ? "" : " dark"}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            className={`search-box${lightTheme ? "" : " dark"}`}
                            placeholder="Search groups"
                        />
                    </div>
                </div>

                <div className="list-items">
                    {groups.map((group, index) => {
                        const isMember = group.users?.some(
                            u => (u._id || u) === userData?._id
                        );
                        return (
                            <motion.div
                                key={group._id || index}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`list-item${lightTheme ? "" : " dark"}`}
                                onClick={() => joinGroup(group)}
                            >
                                <div className="convo-avatar" style={{
                                    width: 38,
                                    height: 38,
                                    fontSize: "0.9rem",
                                    background: "#6c63ff"
                                }}>
                                    {group.chatName?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className={`list-item-name${lightTheme ? "" : " dark"}`}>
                                        {group.chatName}
                                    </p>
                                    <p style={{
                                        fontSize: "0.75rem",
                                        color: lightTheme ? "var(--light-muted)" : "var(--dark-muted)",
                                        marginTop: 2
                                    }}>
                                        {group.users?.length || 0} members · {isMember ? "already joined" : "click to join"}
                                    </p>
                                </div>
                                {/* badge showing membership status */}
                                {isMember && (
                                    <span style={{
                                        fontSize: "0.7rem",
                                        background: "var(--accent-light)",
                                        color: "var(--accent)",
                                        padding: "3px 8px",
                                        borderRadius: "20px",
                                        fontWeight: 600,
                                        flexShrink: 0
                                    }}>
                                        Joined
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                    {groups.length === 0 && (
                        <p style={{
                            textAlign: "center",
                            color: "var(--light-muted)",
                            padding: "20px",
                            fontSize: "0.9rem"
                        }}>
                            No groups found. Create one!
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Groups;
