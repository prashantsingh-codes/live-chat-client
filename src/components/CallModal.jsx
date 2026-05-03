import { useContext, useState, useEffect, useRef } from "react";
import { CallContext } from "../context/CallContext.jsx";
import { ChatContext } from "../context/ChatContext.jsx";
import axios from "axios";

// Detect mobile browser
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const CallModal = () => {
    const {
        callState, localStream, localVideoRef, remoteVideoRef,
        acceptCall, rejectCall, endCall,
        toggleScreenShare, toggleCamTrack, screenSharing,
        callMessages, setCallMessages,
    } = useContext(CallContext);

    const { userData, backendUrl } = useContext(ChatContext);
    const [showChat, setShowChat] = useState(false);
    const [msgInput, setMsgInput] = useState("");
    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);

    // Separate ref for PiP so it's never confused with screen share preview
    const pipRef = useRef(null);

    // Sync PiP video with localStream
    useEffect(() => {
        if (pipRef.current && localStream) {
            pipRef.current.srcObject = localStream;
        }
    }, [localStream, callState.accepted, screenSharing]);

    if (!callState.active) return null;

    // ── Incoming ──
    if (callState.incoming && !callState.accepted) {
        return (
            <div style={styles.overlay}>
                <div style={styles.incomingCard}>
                    <div style={styles.avatarLarge}>
                        {callState.callerName?.[0]?.toUpperCase()}
                    </div>
                    <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginTop: 8 }}>
                        {callState.callerName}
                    </p>
                    <p style={{ color: "#aaa", marginBottom: 32, fontSize: "0.9rem" }}>
                        Incoming {callState.callType} call...
                    </p>
                    <div style={{ display: "flex", gap: 40 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <button onClick={rejectCall} style={styles.rejectCircle}>✕</button>
                            <span style={{ color: "#aaa", fontSize: "0.75rem" }}>Decline</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <button onClick={acceptCall} style={styles.acceptCircle}>✓</button>
                            <span style={{ color: "#aaa", fontSize: "0.75rem" }}>Accept</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!callState.accepted) return null;

    const toggleMute = () => {
        localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setMuted((m) => !m);
    };

    const toggleCam = () => {
        const next = camOff; // if camOff=true, we want to enable → next=true
        toggleCamTrack(next);
        setCamOff(!next);
    };

    const sendCallMessage = async () => {
        if (!msgInput.trim()) return;
        try {
            await axios.post(backendUrl + "/api/message/", {
                content: msgInput,
                chatId: callState.chatId,
            });
        } catch (e) { console.log(e); }
        setCallMessages((prev) => [...prev, {
            sender: userData.name,
            content: msgInput,
            time: new Date().toLocaleTimeString(),
        }]);
        setMsgInput("");
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.fullScreen}>

                {/* Remote video / voice */}
                {callState.callType === "video" ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay playsInline
                        style={{
                            ...styles.remoteVideo,
                            objectFit: screenSharing ? "contain" : "cover",
                        }}
                    />
                ) : (
                    <>
                        <audio
                            ref={(node) => {
                                remoteVideoRef.current = node;
                                if (node && node.srcObject) node.play().catch(() => {});
                            }}
                            autoPlay playsInline
                        />
                        <div style={styles.voiceBg}>
                            <div style={styles.voiceAvatar}>
                                {callState.callerName?.[0]?.toUpperCase()}
                            </div>
                            <p style={styles.voiceName}>{callState.callerName}</p>
                            <p style={styles.voiceStatus}>Voice call in progress...</p>
                        </div>
                    </>
                )}

                {/* Caller name tag */}
                {callState.callType === "video" && (
                    <div style={styles.callerTag}>
                        <div style={styles.callerTagDot} />
                        {callState.callerName}
                        {screenSharing && (
                            <span style={{ marginLeft: 6, fontSize: "0.75rem", color: "#a78bfa" }}>
                                • presenting
                            </span>
                        )}
                    </div>
                )}

                {/* PiP — uses separate pipRef, always shows localStream */}
                {callState.callType === "video" && (
                    <div style={{
                        ...styles.pipWrapper,
                        bottom: screenSharing ? "calc(40% + 16px)" : 100,
                    }}>
                        {camOff ? (
                            <div style={styles.pipCamOff}>
                                <span style={{ fontSize: "1.4rem" }}>📷</span>
                                <span style={{ color: "#aaa", fontSize: "0.68rem" }}>Cam off</span>
                            </div>
                        ) : (
                            <video
                                ref={pipRef}
                                autoPlay playsInline muted
                                style={styles.pipVideo}
                            />
                        )}
                    </div>
                )}

                {/* Screen share: local cam in lower strip */}
                {screenSharing && callState.callType === "video" && (
                    <div style={styles.screenShareLocalArea}>
                        <video
                            ref={localVideoRef}
                            autoPlay playsInline muted
                            style={styles.screenShareLocalVideo}
                        />
                        <span style={styles.youLabel}>You</span>
                    </div>
                )}

                {/* Controls */}
                <div style={styles.controlsBar}>
                    <RoundBtn icon={muted ? "🔇" : "🎤"} active={muted} onClick={toggleMute} />
                    {callState.callType === "video" && (
                        <>
                            <RoundBtn icon={camOff ? "📷" : "📸"} active={camOff} onClick={toggleCam} />
                            {/* Hide screen share on mobile — not supported */}
                            {!isMobile && (
                                <RoundBtn icon="🖥️" active={screenSharing} onClick={toggleScreenShare} />
                            )}
                        </>
                    )}
                    <RoundBtn icon="💬" active={showChat} onClick={() => setShowChat((s) => !s)} />
                    <button onClick={() => endCall(true)} style={styles.endCircle}>📵</button>
                </div>
            </div>

            {/* Chat sheet */}
            {showChat && (
                <div style={styles.chatSheet}>
                    <div style={styles.chatSheetHandle} />
                    <div style={styles.chatSheetHeader}>
                        <span style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>
                            In-call messages
                        </span>
                        <button onClick={() => setShowChat(false)} style={styles.closeBtn}>✕</button>
                    </div>
                    <p style={styles.chatNote}>Messages are saved to your chat.</p>
                    <div style={styles.chatMessages}>
                        {callMessages.map((m, i) => (
                            <div key={i} style={styles.chatMsg}>
                                <span style={{ fontWeight: 600, fontSize: "0.78rem", color: "#a78bfa" }}>
                                    {m.sender}
                                </span>
                                <p style={{ margin: "2px 0 0", fontSize: "0.88rem", color: "#fff" }}>
                                    {m.content}
                                </p>
                                <span style={{ fontSize: "0.68rem", color: "#888" }}>{m.time}</span>
                            </div>
                        ))}
                    </div>
                    <div style={styles.chatInput}>
                        <input
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendCallMessage()}
                            placeholder="Send a message"
                            style={styles.chatInputBox}
                        />
                        <button onClick={sendCallMessage} style={styles.sendBtn}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoundBtn = ({ icon, onClick, active }) => (
    <button onClick={onClick} style={{
        width: 52, height: 52, borderRadius: "50%",
        border: "none", cursor: "pointer", fontSize: "1.3rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
        transition: "background 0.2s",
    }}>
        {icon}
    </button>
);

const styles = {
    overlay: {
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", flexDirection: "column",
    },
    fullScreen: {
        position: "relative", flex: 1, overflow: "hidden",
        background: "#111",
    },
    remoteVideo: {
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        background: "#000",
    },
    voiceBg: {
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "linear-gradient(160deg, #1a1d27 0%, #2d3557 100%)",
    },
    voiceAvatar: {
        width: 100, height: 100, borderRadius: "50%", background: "#4f46e5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2.5rem", color: "#fff", fontWeight: 700,
    },
    voiceName: { color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: 0 },
    voiceStatus: { color: "#aaa", fontSize: "0.9rem", margin: 0 },
    callerTag: {
        position: "absolute", top: 16, left: 16,
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
        color: "#fff", fontSize: "0.85rem", fontWeight: 600,
        padding: "6px 14px", borderRadius: 20,
    },
    callerTagDot: {
        width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
    },
    pipWrapper: {
        position: "absolute", right: 16,
        width: 110, height: 160,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        transition: "bottom 0.3s ease",
        zIndex: 10,
    },
    pipVideo: { width: "100%", height: "100%", objectFit: "cover" },
    pipCamOff: {
        width: "100%", height: "100%", background: "#1e1e2e",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6,
    },
    screenShareLocalArea: {
        position: "absolute", bottom: 90, left: 0, right: 0,
        height: "35%", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    screenShareLocalVideo: {
        height: "100%", maxWidth: "60%",
        objectFit: "cover", borderRadius: 12,
    },
    youLabel: {
        position: "absolute", bottom: 8, left: "50%",
        transform: "translateX(-50%)",
        color: "#fff", fontSize: "0.75rem",
        background: "rgba(0,0,0,0.5)",
        padding: "2px 10px", borderRadius: 10,
    },
    controlsBar: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, padding: "16px 20px 32px",
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
    },
    endCircle: {
        width: 56, height: 56, borderRadius: "50%",
        background: "#e53935", border: "none",
        fontSize: "1.4rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    incomingCard: {
        flex: 1,
        background: "linear-gradient(160deg, #1a1d27 0%, #2d3557 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
    },
    avatarLarge: {
        width: 100, height: 100, borderRadius: "50%", background: "#4f46e5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2.5rem", color: "#fff", fontWeight: 700,
    },
    acceptCircle: {
        width: 64, height: 64, borderRadius: "50%",
        background: "#22c55e", color: "#fff", border: "none",
        fontSize: "1.5rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    rejectCircle: {
        width: 64, height: 64, borderRadius: "50%",
        background: "#e53935", color: "#fff", border: "none",
        fontSize: "1.5rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    chatSheet: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "55%", background: "#1e1e2e",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.5)",
    },
    chatSheetHandle: {
        width: 40, height: 4, borderRadius: 2,
        background: "#444", margin: "12px auto 4px",
    },
    chatSheetHeader: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "8px 16px",
        borderBottom: "1px solid #333",
    },
    chatNote: { fontSize: "0.72rem", color: "#888", padding: "6px 16px" },
    chatMessages: {
        flex: 1, overflowY: "auto", padding: 16,
        display: "flex", flexDirection: "column", gap: 10,
    },
    chatMsg: { background: "#2a2a3e", borderRadius: 10, padding: "8px 12px" },
    chatInput: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #333" },
    chatInputBox: {
        flex: 1, background: "#2a2a3e", border: "none",
        borderRadius: 20, padding: "10px 14px",
        color: "#fff", outline: "none", fontSize: "0.9rem",
    },
    sendBtn: {
        background: "#4f46e5", color: "#fff", border: "none",
        borderRadius: "50%", width: 40, height: 40,
        cursor: "pointer", fontSize: "0.9rem",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    closeBtn: {
        background: "transparent", border: "none",
        color: "#aaa", cursor: "pointer", fontSize: "1rem",
    },
};

export default CallModal;