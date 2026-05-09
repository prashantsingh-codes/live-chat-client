import { createContext, useState, useRef, useContext, useEffect } from "react";
import { ChatContext } from "./ChatContext.jsx";

export const CallContext = createContext();

const iceServers = {
    iceServers: [
        { urls: "stun:stun.relay.metered.ca:80" },
        {
            urls: "turn:global.relay.metered.ca:80",
            username: "6f0da3829a330d35398d8232",
            credential: "X4AekrIXhIHpck5G",
        },
        {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "6f0da3829a330d35398d8232",
            credential: "X4AekrIXhIHpck5G",
        },
        {
            urls: "turn:global.relay.metered.ca:443",
            username: "6f0da3829a330d35398d8232",
            credential: "X4AekrIXhIHpck5G",
        },
        {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "6f0da3829a330d35398d8232",
            credential: "X4AekrIXhIHpck5G",
        },
    ]
};

const audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
};

const CallContextProvider = ({ children, socket }) => {
    const { userData } = useContext(ChatContext);

    const [callState, setCallState] = useState({
        active: false,
        incoming: false,
        accepted: false,
        callType: null,
        callerName: "",
        callerSocketId: "",
        receiverSocketId: "",
        incomingSignal: null,
        chatId: null,
    });

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [screenSharing, setScreenSharing] = useState(false);
    const [callMessages, setCallMessages] = useState([]);

    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenTrackRef = useRef(null);
    const localStreamRef = useRef(null);
    const callStateRef = useRef(callState);
    const userDataRef = useRef(userData); // ✅ single source of truth, never stale

    // Keep callStateRef always in sync
    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    // Keep userDataRef always in sync
    useEffect(() => {
        userDataRef.current = userData;
        console.log("[CallContext] userDataRef updated →", userData?._id, userData?.name);
    }, [userData]);

    // Keep localStreamRef in sync
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callState.accepted]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callState.accepted]);

    // ── Socket listeners ──
    useEffect(() => {
        if (!socket) return;

        socket.on("call:incoming", (data) => {
            setCallState({
                active: true, incoming: true, accepted: false,
                callType: data.callType,
                callerName: data.callerName,
                callerSocketId: data.fromSocketId,
                receiverSocketId: socket.id,
                incomingSignal: data.signal,
                chatId: data.chatId,
            });
        });

        socket.on("call:accepted", ({ signal }) => {
            peerRef.current?.signal(signal);
        });

        socket.on("call:ended", () => endCall(false));

        socket.on("message received", (newMessage) => {
            const cs = callStateRef.current;
            const me = userDataRef.current; // ✅ always fresh

            console.log("[CallContext] 'message received' fired");
            console.log("[CallContext] newMessage →", newMessage);
            console.log("[CallContext] cs.active →", cs.active, "| cs.accepted →", cs.accepted);
            console.log("[CallContext] cs.chatId →", cs.chatId, "| msg chatId →", newMessage?.chat?._id);
            console.log("[CallContext] me._id →", me?._id, "| sender._id →", newMessage?.sender?._id);

            if (!cs.active || !cs.accepted) {
                console.log("[CallContext] SKIPPED — call not active/accepted");
                return;
            }
            if (!newMessage?.chat?._id) {
                console.log("[CallContext] SKIPPED — message has no chat._id");
                return;
            }
            if (newMessage.chat._id !== cs.chatId) {
                console.log("[CallContext] SKIPPED — chatId mismatch");
                return;
            }
            if (newMessage.sender?._id === me?._id) {
                console.log("[CallContext] SKIPPED — own message, already added via sendCallMessage");
                return;
            }

            console.log("[CallContext] ✅ adding incoming message to callMessages");
            setCallMessages((msgs) => [
                ...msgs,
                {
                    sender: newMessage.sender?.name || "Unknown",
                    content: newMessage.content,
                    time: new Date().toLocaleTimeString(),
                },
            ]);
        });

        return () => {
            socket.off("call:incoming");
            socket.off("call:accepted");
            socket.off("call:ended");
            socket.off("message received");
        };
    }, [socket]);

    // ✅ Call this from your chat input component when the current user sends a message
    const sendCallMessage = (content) => {
        console.log("[CallContext] sendCallMessage →", content);
        setCallMessages((msgs) => [
            ...msgs,
            {
                sender: userDataRef.current?.name || "You",
                content,
                time: new Date().toLocaleTimeString(),
                isSelf: true,
            },
        ]);
    };

    const startCall = async (receiverSocketId, receiverName, callType, chatId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === "video",
                audio: audioConstraints,
            });
            setLocalStream(stream);
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const peer = new window.SimplePeer({
                initiator: true,
                trickle: false,
                stream,
                config: iceServers,
            });

            peer.on("signal", (signal) => {
                socket.emit("call:initiate", {
                    toSocketId: receiverSocketId,
                    fromSocketId: socket.id,
                    from: userDataRef.current?._id,       // ✅ was userData._id
                    signal, callType,
                    callerName: userDataRef.current?.name, // ✅ was userData.name
                    chatId,
                });
            });

            peer.on("stream", (remote) => setRemoteStream(remote));
            peer.on("error", (err) => console.log("Peer error:", err));

            peerRef.current = peer;
            setCallState({
                active: true, incoming: false, accepted: true,
                callType, callerName: receiverName,
                receiverSocketId, chatId,
            });
        } catch (err) {
            console.log("Error starting call:", err);
            alert("Could not access camera/microphone. Please check permissions.");
        }
    };

    const acceptCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callState.callType === "video",
                audio: audioConstraints,
            });
            setLocalStream(stream);
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const peer = new window.SimplePeer({
                initiator: false,
                trickle: false,
                stream,
                config: iceServers,
            });

            peer.on("signal", (signal) => {
                socket.emit("call:accepted", {
                    toSocketId: callState.callerSocketId,
                    signal,
                });
            });

            peer.on("stream", (remote) => setRemoteStream(remote));
            peer.on("error", (err) => console.log("Peer error:", err));

            peer.signal(callState.incomingSignal);
            peerRef.current = peer;
            setCallState((prev) => ({ ...prev, accepted: true, incoming: false }));
        } catch (err) {
            console.log("Error accepting call:", err);
        }
    };

    const rejectCall = () => {
        socket.emit("call:rejected", { toSocketId: callState.callerSocketId });
        setCallState({ active: false, incoming: false, accepted: false });
    };

    const endCall = (emit = true) => {
        if (emit) {
            const targetSocketId = callState.callerSocketId || callState.receiverSocketId;
            socket.emit("call:ended", { toSocketId: targetSocketId });
        }
        peerRef.current?.destroy();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenTrackRef.current?.stop();
        setLocalStream(null);
        setRemoteStream(null);
        localStreamRef.current = null;
        setCallState({ active: false, incoming: false, accepted: false });
        setCallMessages([]);
        setScreenSharing(false);
    };

    const toggleScreenShare = async () => {
        if (!screenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;

                const sender = peerRef.current?._pc?.getSenders()
                    .find((s) => s.track?.kind === "video");
                await sender?.replaceTrack(screenTrack);

                if (localVideoRef.current) {
                    const previewStream = new MediaStream([
                        screenTrack,
                        ...localStreamRef.current.getAudioTracks(),
                    ]);
                    localVideoRef.current.srcObject = previewStream;
                }

                screenTrack.onended = () => stopScreenShare();
                setScreenSharing(true);
            } catch (err) {
                console.log("Screen share error:", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        try {
            const camTrack = localStreamRef.current?.getVideoTracks()[0];
            if (camTrack) {
                const sender = peerRef.current?._pc?.getSenders()
                    .find((s) => s.track?.kind === "video");
                await sender?.replaceTrack(camTrack);
            }
            if (localVideoRef.current && localStreamRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
            screenTrackRef.current?.stop();
            screenTrackRef.current = null;
            setScreenSharing(false);
        } catch (err) {
            console.log("Stop screen share error:", err);
        }
    };

    const toggleCamTrack = (enable) => {
        localStreamRef.current?.getVideoTracks().forEach((t) => {
            t.enabled = enable;
        });
    };

    return (
        <CallContext.Provider value={{
            callState, localStream, remoteStream,
            localVideoRef, remoteVideoRef,
            startCall, acceptCall, rejectCall, endCall,
            toggleScreenShare, screenSharing,
            toggleCamTrack,
            callMessages, setCallMessages,
            sendCallMessage,
        }}>
            {children}
        </CallContext.Provider>
    );
};

export default CallContextProvider;