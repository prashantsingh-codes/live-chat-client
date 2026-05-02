import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ChatContext } from "../context/ChatContext.jsx";

const Login = () => {
    const lightTheme = useSelector((state) => state.themeKey);
    const [currentState, setCurrentState] = useState("Login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { backendUrl, setToken, setUserData, token } = useContext(ChatContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) navigate("/app/welcome");
    }, [token]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentState === "Sign Up") {
                const response = await axios.post(backendUrl + "/api/user/register", { name, email, password });
                if (response.data.success) {
                    const user = response.data;
                    // store flat user object — no nesting
                    setToken(user.token);
                    setUserData(user);
                    axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
                    localStorage.setItem("userData", JSON.stringify(user));
                    navigate("/app/welcome");
                } else {
                    toast.error(response.data.message);
                }
            } else {
                const response = await axios.post(backendUrl + "/api/user/login", { name, password });
                if (response.data.success) {
                    const user = response.data;
                    setToken(user.token);
                    setUserData(user);
                    axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
                    localStorage.setItem("userData", JSON.stringify(user));
                    navigate("/app/welcome");
                } else {
                    toast.error(response.data.message);
                }
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
        setLoading(false);
    };

    return (
        <div className={`login-page${lightTheme ? "" : " dark"}`}>
            <div className="login-banner">
                <div className="login-banner-title">LiveChat</div>
                <p className="login-banner-sub">Connect and chat with people in real time</p>
            </div>

            <form onSubmit={onSubmitHandler} className={`login-form-area${lightTheme ? "" : " dark"}`}>
                <p className={`login-heading${lightTheme ? "" : " dark"}`}>
                    {currentState === "Login" ? "Welcome back" : "Create account"}
                </p>
                <p className={`login-sub${lightTheme ? "" : " dark"}`}>
                    {currentState === "Login"
                        ? "Sign in to continue to LiveChat"
                        : "Fill in the details to get started"}
                </p>

                <input
                    className={`login-input${lightTheme ? "" : " dark"}`}
                    type="text"
                    placeholder="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                {currentState === "Sign Up" && (
                    <input
                        className={`login-input${lightTheme ? "" : " dark"}`}
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                )}
                <input
                    className={`login-input${lightTheme ? "" : " dark"}`}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button className="login-btn" type="submit" disabled={loading}>
                    {loading ? "Please wait..." : currentState === "Login" ? "Sign In" : "Sign Up"}
                </button>

                <p className={`login-switch${lightTheme ? "" : " dark"}`}>
                    {currentState === "Login" ? "Don't have an account?" : "Already have an account?"}
                    <span onClick={() => setCurrentState(currentState === "Login" ? "Sign Up" : "Login")}>
                        {currentState === "Login" ? " Sign Up" : " Login"}
                    </span>
                </p>
            </form>
        </div>
    );
};

export default Login;
