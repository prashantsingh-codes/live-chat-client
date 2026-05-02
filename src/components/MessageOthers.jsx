import React from "react";

const MessageOthers = ({ message, lightTheme }) => {
    return (
        <div className="other-message-container">
            <div className="convo-avatar" style={{ width: 32, height: 32, fontSize: "0.8rem", flexShrink: 0 }}>
                {message.sender.name[0]}
            </div>
            <div className="other-bubble-wrap">
                <p className={`other-sender-name${lightTheme ? "" : " dark"}`}>{message.sender.name}</p>
                <div className={`other-bubble${lightTheme ? "" : " dark"}`}>
                    {message.content}
                </div>
            </div>
        </div>
    );
};

export default MessageOthers;
