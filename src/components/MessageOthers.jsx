import React from "react";

const MessageOthers = ({ message, lightTheme, backendUrl }) => {
    return (
        <div className="other-message-container">
            <div className="convo-avatar" style={{ width: 32, height: 32, fontSize: "0.8rem", flexShrink: 0 }}>
                {message.sender.name[0]}
            </div>
            <div className="other-bubble-wrap">
                <p className={`other-sender-name${lightTheme ? "" : " dark"}`}>{message.sender.name}</p>
                <div className={`other-bubble${lightTheme ? "" : " dark"}`}>
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
        </div>
    );
};

export default MessageOthers;