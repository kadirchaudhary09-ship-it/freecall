import { useActor } from "@/hooks/useActor";
import { useWebRTC } from "@/hooks/useWebRTC";
import { addCallEntry, updateCallEntry } from "@/utils/callHistory";
import {
  Copy,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ChatPanel from "./ChatPanel";

interface CallScreenProps {
  username: string;
  userId: string;
  roomCode: string;
  isInitiator: boolean;
  onEndCall: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  variant?: "default" | "danger" | "chat";
  badge?: number;
  "data-ocid"?: string;
}

function ControlButton({
  onClick,
  icon,
  label,
  active = true,
  variant = "default",
  badge,
  "data-ocid": dataOcid,
}: ControlButtonProps) {
  const isDanger = variant === "danger";
  const isChat = variant === "chat";
  const isInactive = !active && !isDanger && !isChat;

  let bg: string;
  let border: string;
  let shadow: string;
  let iconColor: string;

  if (isDanger) {
    bg = "oklch(0.62 0.22 25)";
    border = "1px solid oklch(0.72 0.22 25 / 0.4)";
    shadow =
      "0 0 20px oklch(0.62 0.22 25 / 0.4), 0 4px 12px oklch(0 0 0 / 0.4)";
    iconColor = "oklch(0.97 0.01 0)";
  } else if (isChat && active) {
    bg = "oklch(0.22 0.04 195 / 0.9)";
    border = "1px solid oklch(0.75 0.15 195 / 0.4)";
    shadow =
      "0 0 16px oklch(0.75 0.15 195 / 0.25), 0 4px 12px oklch(0 0 0 / 0.3)";
    iconColor = "oklch(0.75 0.15 195)";
  } else if (isInactive) {
    bg = "oklch(0.18 0.015 260 / 0.9)";
    border = "1px solid oklch(0.45 0.15 25 / 0.4)";
    shadow = "0 4px 12px oklch(0 0 0 / 0.3)";
    iconColor = "oklch(0.72 0.18 25)";
  } else {
    bg = "oklch(0.16 0.012 260 / 0.85)";
    border = "1px solid oklch(0.32 0.015 260 / 0.5)";
    shadow = "0 4px 12px oklch(0 0 0 / 0.3)";
    iconColor = "oklch(0.85 0.01 260)";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-ocid={dataOcid}
      className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ background: bg, border, boxShadow: shadow }}
    >
      <span style={{ color: iconColor }}>{icon}</span>

      {/* Unread badge */}
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{
            background: "oklch(0.62 0.22 25)",
            color: "oklch(0.97 0.01 0)",
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export default function CallScreen({
  username,
  userId,
  roomCode,
  isInitiator,
  onEndCall,
}: CallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { actor } = useActor();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const prevMsgCountRef = useRef(0);

  const {
    isMuted,
    isCameraOff,
    hasRemoteStream,
    permissionError,
    participantCount,
    chatMessages,
    toggleMute,
    toggleCamera,
    sendChatMessage,
  } = useWebRTC({
    roomCode,
    userId,
    isInitiator,
    actor,
    localVideoRef,
    remoteVideoRef,
  });

  // Track call history on mount/unmount
  useEffect(() => {
    const startedAt = startedAtRef.current;
    addCallEntry({
      roomCode,
      startedAt,
      role: isInitiator ? "creator" : "joiner",
      username,
    });

    return () => {
      updateCallEntry(roomCode, startedAt, { endedAt: Date.now() });
    };
  }, [roomCode, isInitiator, username]);

  // Track unread messages when chat is closed
  useEffect(() => {
    const newCount = chatMessages.length;
    if (!isChatOpen && newCount > prevMsgCountRef.current) {
      setUnreadCount((prev) => prev + (newCount - prevMsgCountRef.current));
    }
    prevMsgCountRef.current = newCount;
  }, [chatMessages, isChatOpen]);

  // Clear unread when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  const handleEndCall = useCallback(async () => {
    if (actor) {
      try {
        await actor.leaveRoom(roomCode, userId);
      } catch (err) {
        console.error("Error leaving room:", err);
      }
    }
    onEndCall();
  }, [actor, roomCode, userId, onEndCall]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!", { duration: 2000 });
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleChatSend = useCallback(
    (text: string) => {
      sendChatMessage(text);
    },
    [sendChatMessage],
  );

  // Clean up local video srcObject on unmount
  useEffect(() => {
    const video = localVideoRef.current;
    return () => {
      if (video?.srcObject) {
        video.srcObject = null;
      }
    };
  }, []);

  if (permissionError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "oklch(0.09 0.005 265)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: "oklch(0.2 0.05 25 / 0.3)",
              border: "1px solid oklch(0.62 0.22 25 / 0.3)",
            }}
          >
            <VideoOff
              className="w-7 h-7"
              style={{ color: "oklch(0.72 0.18 25)" }}
            />
          </div>
          <h2
            className="font-semibold mb-2"
            style={{ color: "oklch(0.94 0.01 260)" }}
          >
            Camera Access Required
          </h2>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "oklch(0.55 0.01 260)" }}
          >
            {permissionError}
          </p>
          <button
            type="button"
            onClick={onEndCall}
            className="w-full h-10 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "oklch(0.62 0.22 25)",
              color: "oklch(0.97 0.01 0)",
            }}
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "oklch(0.07 0.004 265)" }}
    >
      {/* Remote video — fills the background */}
      <div className="absolute inset-0 z-0">
        {/* biome-ignore lint/a11y/useMediaCaption: live call stream, captions not applicable */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          aria-label="Remote participant video"
        />

        {/* Waiting overlay — shown when no remote stream */}
        <AnimatePresence>
          {!hasRemoteStream && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.12 0.01 260) 0%, oklch(0.07 0.004 265) 100%)",
              }}
            >
              {/* Pulsing avatar rings */}
              <div className="relative flex items-center justify-center mb-6">
                {/* Outer pulse ring */}
                <div
                  className="absolute w-32 h-32 rounded-full pulse-ring-outer-anim"
                  style={{
                    background: "oklch(0.75 0.15 195 / 0.06)",
                    border: "1px solid oklch(0.75 0.15 195 / 0.15)",
                  }}
                />
                {/* Inner pulse ring */}
                <div
                  className="absolute w-24 h-24 rounded-full pulse-ring-anim"
                  style={{
                    background: "oklch(0.75 0.15 195 / 0.1)",
                    border: "1px solid oklch(0.75 0.15 195 / 0.25)",
                  }}
                />
                {/* Center avatar */}
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold z-10"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.3 0.08 195), oklch(0.2 0.05 220))",
                    border: "2px solid oklch(0.75 0.15 195 / 0.4)",
                    boxShadow: "0 0 30px oklch(0.75 0.15 195 / 0.2)",
                    color: "oklch(0.85 0.08 195)",
                  }}
                >
                  <Wifi className="w-7 h-7" />
                </div>
              </div>

              <p
                className="font-medium"
                style={{ color: "oklch(0.75 0.01 260)" }}
              >
                Waiting for others to join…
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "oklch(0.45 0.01 260)" }}
              >
                Share the room code below
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dark vignette at top and bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0 0 0 / 0.65) 0%, transparent 25%, transparent 70%, oklch(0 0 0 / 0.75) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2 sm:px-6">
        {/* Room code */}
        <div
          data-ocid="call.room_code"
          className="flex items-center gap-2 glass-dark rounded-full px-3 py-1.5"
        >
          <span
            className="font-geist-mono text-xs font-medium tracking-widest"
            style={{ color: "oklch(0.75 0.15 195)" }}
          >
            {roomCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy room code"
            className="opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none"
            style={{ color: "oklch(0.65 0.01 260)" }}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Participant count */}
        <div className="flex items-center gap-1.5 glass-dark rounded-full px-3 py-1.5">
          <Users
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.65 0.01 260)" }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(0.75 0.01 260)" }}
          >
            {participantCount}
          </span>
        </div>
      </header>

      {/* Local PiP video — shift left when chat is open */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          right: isChatOpen ? "calc(clamp(280px, 35vw, 380px) + 16px)" : "16px",
        }}
        transition={{
          delay: isChatOpen ? 0 : 0.3,
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute bottom-28 z-10 sm:bottom-32"
        style={{
          width: "90px",
          height: "128px",
        }}
      >
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden"
          style={{
            border: "2px solid oklch(0.75 0.15 195 / 0.35)",
            boxShadow:
              "0 4px 20px oklch(0 0 0 / 0.5), 0 0 12px oklch(0.75 0.15 195 / 0.15)",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Your local video"
          />

          {/* Camera off overlay */}
          <AnimatePresence>
            {isCameraOff && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: "oklch(0.1 0.008 260)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.3 0.06 195), oklch(0.2 0.04 220))",
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: "oklch(0.85 0.08 195)" }}
                  >
                    {getInitials(username)}
                  </span>
                </div>
                <span
                  className="text-[10px]"
                  style={{ color: "oklch(0.5 0.01 260)" }}
                >
                  Camera off
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Username label */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px]"
          style={{
            background: "oklch(0.12 0.01 260 / 0.9)",
            color: "oklch(0.7 0.01 260)",
            border: "1px solid oklch(0.25 0.01 260)",
          }}
        >
          You
        </div>
      </motion.div>

      {/* Bottom controls toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-4 px-4 flex flex-col items-center gap-4">
        {/* Status label */}
        <AnimatePresence>
          {(isMuted || isCameraOff) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2"
            >
              {isMuted && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium glass-dark"
                  style={{ color: "oklch(0.72 0.18 25)" }}
                >
                  Muted
                </span>
              )}
              {isCameraOff && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium glass-dark"
                  style={{ color: "oklch(0.72 0.18 25)" }}
                >
                  Camera Off
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="glass-toolbar rounded-full px-6 py-3 flex items-center gap-4"
        >
          <ControlButton
            data-ocid="call.mute_toggle"
            onClick={toggleMute}
            label={isMuted ? "Unmute microphone" : "Mute microphone"}
            active={!isMuted}
            icon={
              isMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )
            }
          />

          <ControlButton
            data-ocid="call.camera_toggle"
            onClick={toggleCamera}
            label={isCameraOff ? "Turn camera on" : "Turn camera off"}
            active={!isCameraOff}
            icon={
              isCameraOff ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )
            }
          />

          {/* Chat toggle */}
          <ControlButton
            data-ocid="call.chat_toggle"
            onClick={() => setIsChatOpen((prev) => !prev)}
            label={isChatOpen ? "Close chat" : "Open chat"}
            active={isChatOpen}
            variant="chat"
            badge={isChatOpen ? undefined : unreadCount}
            icon={<MessageSquare className="w-5 h-5" />}
          />

          <ControlButton
            data-ocid="call.end_button"
            onClick={handleEndCall}
            label="End call"
            variant="danger"
            icon={<PhoneOff className="w-5 h-5" />}
          />
        </motion.div>
      </div>

      {/* Chat panel overlay */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSend={handleChatSend}
        username={username}
      />
    </div>
  );
}
