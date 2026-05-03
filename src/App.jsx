import React, { useEffect, useRef } from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";
import ChatContextProvider from "./context/ChatContext.jsx";
import CallContextProvider from "./context/CallContext.jsx";
import CallModal from "./components/CallModal.jsx";
import Login from "./pages/Login.jsx";
import MainContainer from "./pages/MainContainer.jsx";
import Welcome from "./components/Welcome.jsx";
import ChatArea from "./components/ChatArea.jsx";
import Users from "./components/Users.jsx";
import Groups from "./components/Groups.jsx";
import CreateGroups from "./components/CreateGroups.jsx";

// Global socket for call signaling
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const globalSocket = io(backendUrl, { autoConnect: true });

function App() {
    const lightTheme = useSelector((state) => state.themeKey);

    return (
        <ChatContextProvider>
            <CallContextProvider socket={globalSocket}>
                <div className={`app-wrapper${lightTheme ? "" : " dark"}`}>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/app" element={<MainContainer />}>
                            <Route path="welcome" element={<Welcome />} />
                            <Route path="chat/:_id" element={<ChatArea />} />
                            <Route path="users" element={<Users />} />
                            <Route path="groups" element={<Groups />} />
                            <Route path="create-groups" element={<CreateGroups />} />
                        </Route>
                    </Routes>
                    <CallModal />
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </CallContextProvider>
        </ChatContextProvider>
    );
}
// In App.jsx — add export
export const globalSocket = io(backendUrl, { autoConnect: true });
export default App;