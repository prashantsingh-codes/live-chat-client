import { useContext, useState } from "react";
import { CallContext } from "../context/CallContext.jsx";
import { ChatContext } from "../context/ChatContext.jsx";
import axios from "axios";

const CallModal = () => {
    const {
        callState, localVideoRef, remoteVideoRef,
        acceptCall, rejectCall, endCall,
        toggleScreenShare, screenSharing,
        callMessages, setCallMessages,
    } = useContext(CallContext);

    const { userData, backendUrl } = useContext(ChatContext);
    const [showChat, setShowChat] = useState(false);
    const [msgInput, setMsgInput] = useState("");
    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);

    if (!callState.active) return null;

    // ── Incoming call screen ──
    if (callState.incoming && !callState.accepted) {
        return (
            <div style={styles.overlay}>
                <div style={styles.incomingCard}>
                    <div style={styles.avatar}>
                        {callState.callerName?.[0]?.toUpperCase()}
                    </div>
                    <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff" }}>
                        {callState.callerName}
                    </p>
                    <p style={{ color: "#aaa", marginBottom: 24 }}>
                        Incoming {callState.callType} call...
                    </p>
                    <div style={{ display: "flex", gap: 16 }}>
                        <button onClick={rejectCall} style={styles.rejectBtn}>✕ Decline</button>
                        <button onClick={acceptCall} style={styles.acceptBtn}>✓ Accept</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!callState.accepted) return null;

    const toggleMute = () => {
        localVideoRef.current?.srcObject
            ?.getAudioTracks()
            .forEach((t) => (t.enabled = !t.enabled));
        setMuted((m) => !m);
    };

    const toggleCam = () => {
        localVideoRef.current?.srcObject
            ?.getVideoTracks()
            .forEach((t) => (t.enabled = !t.enabled));
        setCamOff((c) => !c);
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
            <div style={{
                ...styles.meetContainer,
                gridTemplateColumns: showChat ? "1fr 320px" : "1fr"
            }}>
                {/* ── Video / Audio Area ── */}
                <div style={styles.videoArea}>
                    {callState.callType === "video" ? (
                        <video ref={remoteVideoRef} autoPlay playsInline style={styles.remoteVideo} />
                    ) : (
                        <>
                            {/* ref callback ensures srcObject is set even if stream arrived before mount */}
                            <audio
                                ref={(node) => {
                                    remoteVideoRef.current = node;
                                    if (node && node.srcObject) node.play().catch(() => {});
                                }}
                                autoPlay
                                playsInline
                            />
                            <div style={styles.voiceScreen}>
                                <div style={styles.avatarLarge}>
                                    {callState.callerName?.[0]?.toUpperCase()}
                                </div>
                                <p style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 600 }}>
                                    {callState.callerName}
                                </p>
                                <p style={{ color: "#aaa" }}>Voice call in progress...</p>
                            </div>
                        </>
                    )}

                    {callState.callType === "video" && (
                        <video ref={localVideoRef} autoPlay playsInline muted style={styles.localVideo} />
                    )}

                    <p style={styles.remoteName}>{callState.callerName}</p>

                    {/* ── Controls ── */}
                    <div style={styles.controls}>
                        <CtrlBtn icon={muted ? "🔇" : "🎤"} label={muted ? "Unmute" : "Mute"} onClick={toggleMute} />
                        {callState.callType === "video" && (
                            <>
                                <CtrlBtn icon={camOff ? "📷" : "📸"} label={camOff ? "Cam On" : "Cam Off"} onClick={toggleCam} />
                                <CtrlBtn
                                    icon="🖥️"
                                    label={screenSharing ? "Stop Share" : "Share Screen"}
                                    onClick={toggleScreenShare}
                                    active={screenSharing}
                                />
                            </>
                        )}
                        <CtrlBtn icon="💬" label="Chat" onClick={() => setShowChat((s) => !s)} active={showChat} />
                        <button onClick={() => endCall(true)} style={styles.endBtn}>📵 End</button>
                    </div>
                </div>

                {/* ── In-call Chat Panel ── */}
                {showChat && (
                    <div style={styles.chatPanel}>
                        <div style={styles.chatHeader}>
                            <span style={{ fontWeight: 600, color: "#fff" }}>In-call messages</span>
                            <button onClick={() => setShowChat(false)} style={styles.closeBtn}>✕</button>
                        </div>
                        <p style={styles.chatNote}>Messages are saved to your chat.</p>
                        <div style={styles.chatMessages}>
                            {callMessages.map((m, i) => (
                                <div key={i} style={styles.chatMsg}>
                                    <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#a78bfa" }}>
                                        {m.sender}
                                    </span>
                                    <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#fff" }}>
                                        {m.content}
                                    </p>
                                    <span style={{ fontSize: "0.7rem", color: "#888" }}>{m.time}</span>
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
        </div>
    );
};

const CtrlBtn = ({ icon, label, onClick, active }) => (
    <button onClick={onClick} style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 4, padding: "10px 14px", borderRadius: 10, border: "none",
        color: "#fff", cursor: "pointer", minWidth: 60,
        background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
    }}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        <span style={{ fontSize: "0.7rem" }}>{label}</span>
    </button>
);

const styles = {
    overlay: { position: "fixed", inset: 0, background: "#000", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
meetContainer: { 
    display: "grid", 
    width: "100%", 
    height: "100vh",
    overflow: "hidden",
    position: "relative",
},
videoArea: { 
    position: "relative", 
    background: "#111", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
},
remoteVideo: { 
    position: "absolute",
    inset: 0,
    width: "100%", 
    height: "100%", 
    objectFit: "cover" 
},
    localVideo: { position: "absolute", bottom: 90, right: 16, width: 180, height: 120, borderRadius: 12, objectFit: "cover", border: "2px solid #444" },
    voiceScreen: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
    remoteName: { position: "absolute", bottom: 90, left: 16, color: "#fff", fontSize: "0.9rem", background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 6 },
    controls: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 16, background: "rgba(0,0,0,0.5)" },
    endBtn: { background: "#e53935", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600 },
    incomingCard: { background: "#1e1e2e", borderRadius: 16, padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
    avatar: { width: 72, height: 72, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#fff", marginBottom: 8 },
    avatarLarge: { width: 100, height: 100, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", color: "#fff" },
    acceptBtn: { background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontWeight: 600, fontSize: "1rem" },
    rejectBtn: { background: "#e53935", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontWeight: 600, fontSize: "1rem" },
    chatPanel: { background: "#1e1e2e", display: "flex", flexDirection: "column" },
    chatHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottom: "1px solid #333" },
    chatNote: { fontSize: "0.75rem", color: "#888", padding: "8px 16px" },
    chatMessages: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
    chatMsg: { background: "#2a2a3e", borderRadius: 8, padding: "8px 12px" },
    chatInput: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #333" },
    chatInputBox: { flex: 1, background: "#2a2a3e", border: "none", borderRadius: 8, padding: "10px 14px", color: "#fff", outline: "none" },
    sendBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer" },
    closeBtn: { background: "transparent", border: "none", color: "#aaa", cursor: "pointer", fontSize: "1rem" },
};

export default CallModal;