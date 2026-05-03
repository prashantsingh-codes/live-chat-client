import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { globalSocket } from "../App.jsx";

export const ChatContext = createContext();

const ChatContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [token, setToken] = useState("");
    const [chats, setChats] = useState([]);
    const [refresh, setRefresh] = useState(false);

    const logout = () => {
        localStorage.removeItem("userData");
        setUserData(null);
        setToken("");
        setChats([]);
        delete axios.defaults.headers.common["Authorization"];
        navigate("/");
    };

    const fetchChats = async () => {
        try {
            const response = await axios.get(backendUrl + "/api/chat/");
            if (response.data.success) {
                setChats(response.data.chats);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // On mount — restore session from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("userData");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const user = parsed.data ? parsed.data : parsed;
                setUserData(user);
                setToken(user.token);
                axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;

                // ✅ Emit setup on global socket so userSocketMap is populated
                globalSocket.emit("setup", user);

                fetchChats();
            } catch (e) {
                localStorage.removeItem("userData");
                navigate("/");
            }
        } else {
            navigate("/");
        }
    }, []);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            fetchChats();
        }
    }, [refresh, token]);

    const value = {
        backendUrl,
        userData,
        setUserData,
        token,
        setToken,
        chats,
        setChats,
        refresh,
        setRefresh,
        logout,
        fetchChats
    };

    return (
        <ChatContext.Provider value={value}>
            {props.children}
        </ChatContext.Provider>
    );
};

export default ChatContextProvider;