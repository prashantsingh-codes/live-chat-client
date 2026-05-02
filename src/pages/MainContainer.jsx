import React, { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar.jsx";
import { ChatContext } from "../context/ChatContext.jsx";

const MainContainer = () => {
    const lightTheme = useSelector((state) => state.themeKey);
    const { token } = useContext(ChatContext);
    const navigate = useNavigate();

    // FIX BUG 1: redirect to login if no token AND no localStorage session
    useEffect(() => {
        const stored = localStorage.getItem("userData");
        if (!token && !stored) {
            navigate("/");
        }
    }, [token]);

    return (
        <div className={`main-container${lightTheme ? "" : " dark"}`}>
            <Sidebar />
            <Outlet />
        </div>
    );
};

export default MainContainer;
