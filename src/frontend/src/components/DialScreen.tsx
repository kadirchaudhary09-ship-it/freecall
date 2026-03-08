import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@/hooks/useActor";
import {
  ChevronLeft,
  Clock,
  Hash,
  Loader2,
  LogIn,
  Plus,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

interface DialScreenProps {
  username: string;
  userId: string;
  onJoinCall: (roomCode: string, isInitiator: boolean) => void;
  onBack: () => void;
  onGoToHistory: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function DialScreen({
  username,
  userId,
  onJoinCall,
  onBack,
  onGoToHistory,
}: DialScreenProps) {
  const { actor } = useActor();
  const [mode, setMode] = useState<"idle" | "join">("idle");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = async () => {
    if (!actor) {
      toast.error("Connecting to backend…");
      return;
    }
    setIsCreating(true);
    try {
      const code = generateRoomCode();
      await actor.createRoom(code);
      await actor.joinRoom(code, userId);
      onJoinCall(code, true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setJoinError("Please enter a valid room code.");
      return;
    }
    if (!actor) {
      toast.error("Connecting to backend…");
      return;
    }
    setIsJoining(true);
    try {
      await actor.joinRoom(code, userId);
      onJoinCall(code, false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to join room. Check the code and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 20%, oklch(0.65 0.14 195 / 0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 70% 80%, oklch(0.75 0.15 195 / 0.05) 0%, transparent 55%), oklch(0.09 0.005 265)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-100 opacity-60 focus-visible:outline-none focus-visible:ring-2 rounded"
          style={{ color: "oklch(0.75 0.01 260)" }}
          aria-label="Back to home"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Right side: history + user avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="dial.history_button"
            onClick={onGoToHistory}
            className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg transition-all hover:opacity-100 opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: "oklch(0.15 0.01 260 / 0.7)",
              border: "1px solid oklch(0.28 0.012 260 / 0.5)",
              color: "oklch(0.68 0.01 260)",
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            Recent Calls
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2.5">
            <span
              className="text-sm hidden sm:block"
              style={{ color: "oklch(0.65 0.01 260)" }}
            >
              {username}
            </span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.12 195), oklch(0.45 0.1 220))",
                color: "oklch(0.95 0.005 260)",
              }}
            >
              {getInitials(username)}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Video
                className="w-5 h-5"
                style={{ color: "oklch(0.75 0.15 195)" }}
              />
              <h2
                className="text-lg font-semibold"
                style={{ color: "oklch(0.94 0.01 260)" }}
              >
                Start or Join a Call
              </h2>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.5 0.01 260)" }}>
              Create a new room or enter a code to join an existing call
            </p>
          </div>

          {/* Action cards */}
          <div className="flex flex-col gap-4">
            {/* Create Room */}
            <motion.div
              className="glass-dark rounded-2xl p-5"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "oklch(0.2 0.03 195 / 0.6)",
                    border: "1px solid oklch(0.75 0.15 195 / 0.2)",
                  }}
                >
                  <Plus
                    className="w-5 h-5"
                    style={{ color: "oklch(0.75 0.15 195)" }}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold text-sm mb-0.5"
                    style={{ color: "oklch(0.94 0.01 260)" }}
                  >
                    Create a Room
                  </h3>
                  <p
                    className="text-xs mb-3"
                    style={{ color: "oklch(0.5 0.01 260)" }}
                  >
                    Start a new call and share the code with others
                  </p>
                  <Button
                    data-ocid="dial.create_button"
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className="h-9 px-5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: "oklch(0.75 0.15 195)",
                      color: "oklch(0.09 0.005 265)",
                    }}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Join call */}
            <motion.div
              className="glass-dark rounded-2xl overflow-hidden"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <button
                type="button"
                className="w-full p-5 text-left focus-visible:outline-none focus-visible:ring-2"
                onClick={() => setMode(mode === "join" ? "idle" : "join")}
                aria-expanded={mode === "join"}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "oklch(0.18 0.015 260 / 0.8)",
                      border: "1px solid oklch(0.35 0.012 260 / 0.4)",
                    }}
                  >
                    <Hash
                      className="w-5 h-5"
                      style={{ color: "oklch(0.65 0.01 260)" }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-semibold text-sm mb-0.5"
                      style={{ color: "oklch(0.94 0.01 260)" }}
                    >
                      Join a Call
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.5 0.01 260)" }}
                    >
                      Enter a room code to join an existing call
                    </p>
                  </div>
                  <LogIn
                    className="w-4 h-4 mt-1 flex-shrink-0 transition-transform"
                    style={{
                      color: "oklch(0.5 0.01 260)",
                      transform: mode === "join" ? "rotate(90deg)" : "none",
                    }}
                  />
                </div>
              </button>

              <AnimatePresence>
                {mode === "join" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <form
                      onSubmit={handleJoinRoom}
                      className="px-5 pb-5 pt-1 flex flex-col gap-3"
                    >
                      <div
                        className="h-px w-full mb-1"
                        style={{ background: "oklch(0.25 0.015 260)" }}
                        aria-hidden="true"
                      />
                      <div>
                        <label
                          htmlFor="room-code-input"
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: "oklch(0.6 0.01 260)" }}
                        >
                          Room Code
                        </label>
                        <Input
                          id="room-code-input"
                          data-ocid="dial.input"
                          type="text"
                          placeholder="e.g. ABC123"
                          value={joinCode}
                          onChange={(e) => {
                            setJoinCode(e.target.value.toUpperCase());
                            if (joinError) setJoinError("");
                          }}
                          className="h-10 rounded-lg font-geist-mono text-sm tracking-widest uppercase"
                          style={{
                            background: "oklch(0.12 0.008 260)",
                            border: "1px solid oklch(0.28 0.015 260)",
                            color: "oklch(0.94 0.01 260)",
                            fontSize: "16px",
                          }}
                          autoFocus
                          autoComplete="off"
                          maxLength={8}
                        />
                        {joinError && (
                          <p
                            className="mt-1.5 text-xs"
                            style={{ color: "oklch(0.72 0.18 25)" }}
                            role="alert"
                          >
                            {joinError}
                          </p>
                        )}
                      </div>
                      <Button
                        data-ocid="dial.primary_button"
                        type="submit"
                        disabled={isJoining}
                        className="h-10 w-full rounded-lg text-sm font-semibold"
                        style={{
                          background: "oklch(0.75 0.15 195)",
                          color: "oklch(0.09 0.005 265)",
                        }}
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Joining…
                          </>
                        ) : (
                          "Join Call"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Info note */}
          <p
            className="mt-6 text-center text-xs"
            style={{ color: "oklch(0.38 0.008 260)" }}
          >
            Signed in as{" "}
            <span style={{ color: "oklch(0.65 0.12 195)" }}>{username}</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
