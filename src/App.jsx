import React from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatContextProvider from "./context/ChatContext.jsx";
import Login from "./pages/Login.jsx";
import MainContainer from "./pages/MainContainer.jsx";
import Welcome from "./components/Welcome.jsx";
import ChatArea from "./components/ChatArea.jsx";
import Users from "./components/Users.jsx";
import Groups from "./components/Groups.jsx";
import CreateGroups from "./components/CreateGroups.jsx";

function App() {
    const lightTheme = useSelector((state) => state.themeKey);

    return (
        <ChatContextProvider>
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
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </ChatContextProvider>
    );
}

export default App;
