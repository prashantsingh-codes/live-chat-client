import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ChatContext } from "../context/ChatContext.jsx";

const CreateGroups = () => {
    const lightTheme = useSelector((state) => state.themeKey);
    const { backendUrl, refresh, setRefresh } = useContext(ChatContext);
    const [groupName, setGroupName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const createGroup = async () => {
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + "/api/chat/createGroup", {
                name: groupName,
                users: "[]"
            });
            if (response.data.success) {
                toast.success("Group created successfully");
                setGroupName("");
                setRefresh(!refresh);
                navigate("/app/groups");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
        setLoading(false);
    };

    return (
        <div className={`createGroups-container${lightTheme ? "" : " dark"}`}>
            <div className={`create-group-card${lightTheme ? "" : " dark"}`}>
                <p className={`create-group-title${lightTheme ? "" : " dark"}`}>Create a Group</p>
                <p style={{ fontSize: "0.85rem", color: "var(--light-muted)" }}>
                    Create a group chat and invite others to join
                </p>
                <input
                    className={`login-input${lightTheme ? "" : " dark"}`}
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createGroup(); }}
                />
                <button className="login-btn" onClick={createGroup} disabled={loading}>
                    {loading ? "Creating..." : "Create Group"}
                </button>
            </div>
        </div>
    );
};

export default CreateGroups;
