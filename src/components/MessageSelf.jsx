import React from "react";

const MessageSelf = ({ message }) => {
    return (
        <div className="self-message-container">
            <div className="self-bubble">
                {message.content}
            </div>
        </div>
    );
};

export default MessageSelf;
