import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  ts: number;
}

interface UseWebRTCOptions {
  roomCode: string;
  userId: string;
  isInitiator: boolean;
  actor: backendInterface | null;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

interface UseWebRTCReturn {
  isMuted: boolean;
  isCameraOff: boolean;
  hasRemoteStream: boolean;
  permissionError: string | null;
  participantCount: number;
  chatMessages: ChatMessage[];
  toggleMute: () => void;
  toggleCamera: () => void;
  sendChatMessage: (text: string) => Promise<void>;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const POLL_INTERVAL_MS = 1500;

export function useWebRTC({
  roomCode,
  userId,
  isInitiator,
  actor,
  localVideoRef,
  remoteVideoRef,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  // Map from peerId -> RTCPeerConnection
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const initiatorSentRef = useRef(false);

  // Create or get a peer connection for a given peer
  const getOrCreatePeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && actor) {
          try {
            await actor.sendSignal(
              roomCode,
              userId,
              peerId,
              JSON.stringify(event.candidate.toJSON()),
            );
          } catch (err) {
            console.error("Failed to send ICE candidate:", err);
          }
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setHasRemoteStream(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setHasRemoteStream(false);
        }
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [actor, roomCode, userId, remoteVideoRef],
  );

  // Process incoming signals
  const processSignals = useCallback(async () => {
    if (!actor) return;

    try {
      const signals = await actor.getPendingSignals(roomCode, userId);
      if (signals.length === 0) return;

      for (const signal of signals) {
        const { from: peerId, data } = signal;
        if (!peerId || !data) continue;

        // Check if this is a chat message
        if (data.startsWith("chat:")) {
          try {
            const payload = JSON.parse(data.slice(5)) as {
              from: string;
              text: string;
              ts: number;
            };
            const msg: ChatMessage = {
              id: `${payload.ts}_${payload.from}`,
              from: payload.from,
              text: payload.text,
              ts: payload.ts,
            };
            setChatMessages((prev) => [...prev, msg]);
          } catch (chatErr) {
            console.error("Failed to parse chat message:", chatErr);
          }
          continue;
        }

        try {
          const parsed = JSON.parse(data);

          if (parsed.type === "offer") {
            const pc = getOrCreatePeerConnection(peerId);
            await pc.setRemoteDescription(new RTCSessionDescription(parsed));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await actor.sendSignal(
              roomCode,
              userId,
              peerId,
              JSON.stringify(answer),
            );
          } else if (parsed.type === "answer") {
            const pc = peerConnectionsRef.current.get(peerId);
            if (pc && pc.signalingState !== "stable") {
              await pc.setRemoteDescription(new RTCSessionDescription(parsed));
            }
          } else if (parsed.candidate !== undefined) {
            // ICE candidate
            const pc = getOrCreatePeerConnection(peerId);
            try {
              await pc.addIceCandidate(new RTCIceCandidate(parsed));
            } catch {
              // Silently ignore ICE candidate errors (race conditions)
            }
          }
        } catch (parseErr) {
          console.error("Failed to process signal:", parseErr);
        }
      }

      await actor.clearSignals(roomCode, userId);
    } catch (err) {
      console.error("Error processing signals:", err);
    }
  }, [actor, roomCode, userId, getOrCreatePeerConnection]);

  // Send a chat message to all other participants in the room
  const sendChatMessage = useCallback(
    async (text: string) => {
      if (!actor || !text.trim()) return;

      try {
        const roomInfo = await actor.getRoomInfo(roomCode);
        const others = roomInfo.participants.filter((p) => p !== userId);
        const ts = Date.now();
        const payload = JSON.stringify({ from: userId, text: text.trim(), ts });
        const data = `chat:${payload}`;

        // Send to all other participants in parallel
        await Promise.all(
          others.map((peerId) =>
            actor.sendSignal(roomCode, userId, peerId, data),
          ),
        );

        // Add own message to local state
        const msg: ChatMessage = {
          id: `${ts}_${userId}`,
          from: userId,
          text: text.trim(),
          ts,
        };
        setChatMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error("Failed to send chat message:", err);
      }
    },
    [actor, roomCode, userId],
  );

  // Send offers to existing participants (initiator flow)
  const sendOffersToParticipants = useCallback(async () => {
    if (!actor || initiatorSentRef.current) return;
    initiatorSentRef.current = true;

    try {
      const roomInfo = await actor.getRoomInfo(roomCode);
      const others = roomInfo.participants.filter((p) => p !== userId);
      setParticipantCount(roomInfo.participants.length);

      for (const peerId of others) {
        const pc = getOrCreatePeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await actor.sendSignal(roomCode, userId, peerId, JSON.stringify(offer));
      }
    } catch (err) {
      console.error("Error sending offers:", err);
    }
  }, [actor, roomCode, userId, getOrCreatePeerConnection]);

  // Update participant count periodically
  const updateParticipantCount = useCallback(async () => {
    if (!actor) return;
    try {
      const roomInfo = await actor.getRoomInfo(roomCode);
      setParticipantCount(roomInfo.participants.length);
    } catch {
      // ignore
    }
  }, [actor, roomCode]);

  // Main setup: get user media, start polling
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      // 1. Get user media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          for (const t of stream.getTracks()) {
            t.stop();
          }
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof DOMException) {
            if (
              err.name === "NotAllowedError" ||
              err.name === "PermissionDeniedError"
            ) {
              setPermissionError(
                "Camera/microphone access was denied. Please allow access in your browser settings and refresh.",
              );
            } else if (err.name === "NotFoundError") {
              setPermissionError(
                "No camera or microphone found. Please connect a device and refresh.",
              );
            } else {
              setPermissionError(`Media error: ${err.message}`);
            }
          } else {
            setPermissionError(
              "Could not access camera/microphone. Please try again.",
            );
          }
        }
        return;
      }

      // 2. If initiator, send offers once actor is ready
      if (isInitiator && actor) {
        await sendOffersToParticipants();
      }

      // 3. Start polling for signals
      pollingIntervalRef.current = setInterval(async () => {
        if (cancelled) return;
        await processSignals();
        await updateParticipantCount();
      }, POLL_INTERVAL_MS);
    };

    setup();

    return () => {
      cancelled = true;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [
    actor,
    isInitiator,
    localVideoRef,
    processSignals,
    sendOffersToParticipants,
    updateParticipantCount,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getTracks()) {
          t.stop();
        }
      }
      for (const pc of peerConnectionsRef.current.values()) {
        pc.close();
      }
      peerConnectionsRef.current.clear();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    const newMuted = !isMuted;
    for (const track of audioTracks) {
      track.enabled = !newMuted;
    }
    setIsMuted(newMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    const newCameraOff = !isCameraOff;
    for (const track of videoTracks) {
      track.enabled = !newCameraOff;
    }
    setIsCameraOff(newCameraOff);
  }, [isCameraOff]);

  return {
    isMuted,
    isCameraOff,
    hasRemoteStream,
    permissionError,
    participantCount,
    chatMessages,
    toggleMute,
    toggleCamera,
    sendChatMessage,
  };
}
