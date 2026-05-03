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
    const localStreamRef = useRef(null); // always up-to-date stream ref

    // Keep localStreamRef in sync
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    // Assign remote stream to ref after render
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callState.accepted]);

    // Assign local stream to localVideoRef after render
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callState.accepted]);

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

        return () => {
            socket.off("call:incoming");
            socket.off("call:accepted");
            socket.off("call:ended");
        };
    }, [socket]);

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
                    from: userData._id,
                    signal, callType,
                    callerName: userData.name,
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
        console.trace("endCall called, emit:", emit);
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

                // Replace video track in peer
                const sender = peerRef.current?._pc?.getSenders()
                    .find((s) => s.track?.kind === "video");
                await sender?.replaceTrack(screenTrack);

                // Show screen in local preview
                if (localVideoRef.current) {
                    // Merge screen video + original audio into one stream for preview
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
            // Restore camera preview
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

    // Expose toggleCam here so it uses localStreamRef (never stale)
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
        }}>
            {children}
        </CallContext.Provider>
    );
};

export default CallContextProvider;