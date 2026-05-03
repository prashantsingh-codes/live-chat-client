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

    // Assign remote stream to ref whenever stream arrives or ref mounts
useEffect(() => {
    console.log("remoteStream:", remoteStream);
    console.log("remoteVideoRef.current:", remoteVideoRef.current);
    if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("srcObject assigned");
    }
}, [remoteStream, callState.accepted]);

    const startCall = async (receiverSocketId, receiverName, callType, chatId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === "video",
                audio: audioConstraints,
            });
            setLocalStream(stream);
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
                    signal,
                    callType,
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
        localStream?.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
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
                sender?.replaceTrack(screenTrack);
                if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
                screenTrack.onended = () => toggleScreenShare();
                setScreenSharing(true);
            } catch (err) {
                console.log("Screen share error:", err);
            }
        } else {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const camTrack = camStream.getVideoTracks()[0];
            const sender = peerRef.current?._pc?.getSenders()
                .find((s) => s.track?.kind === "video");
            sender?.replaceTrack(camTrack);
            if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
            screenTrackRef.current?.stop();
            setScreenSharing(false);
        }
    };

    return (
        <CallContext.Provider value={{
            callState, localStream, remoteStream,
            localVideoRef, remoteVideoRef,
            startCall, acceptCall, rejectCall, endCall,
            toggleScreenShare, screenSharing,
            callMessages, setCallMessages,
        }}>
            {children}
        </CallContext.Provider>
    );
};

export default CallContextProvider;