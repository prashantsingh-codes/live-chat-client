import React from "react";

const MessageSelf = ({ message, backendUrl }) => {
    return (
        <div className="self-message-container">
            <div className="self-bubble">
                {message.content && <p>{message.content}</p>}
                {message.mediaUrl && message.mediaType === "image" && (
                    <img
                        src={backendUrl + message.mediaUrl}
                        alt="media"
                        style={{
                            maxWidth: "100%", borderRadius: 8,
                            marginTop: message.content ? 6 : 0,
                            display: "block", cursor: "pointer",
                        }}
                        onClick={() => window.open(backendUrl + message.mediaUrl, "_blank")}
                    />
                )}
                {message.mediaUrl && message.mediaType === "video" && (
                    <video
                        src={backendUrl + message.mediaUrl}
                        controls
                        style={{
                            maxWidth: "100%", borderRadius: 8,
                            marginTop: message.content ? 6 : 0,
                            display: "block",
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MessageSelf;