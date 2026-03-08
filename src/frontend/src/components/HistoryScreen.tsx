import { type CallHistoryEntry, getCallHistory } from "@/utils/callHistory";
import { ChevronLeft, Clock, History, PhoneCall, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

interface HistoryScreenProps {
  username: string;
  onNewCall: () => void;
  onBack: () => void;
  onRejoin: (roomCode: string) => void;
}

function formatDuration(startedAt: number, endedAt?: number): string {
  if (!endedAt) return "Ongoing";
  const secs = Math.floor((endedAt - startedAt) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  if (mins < 60) return `${mins}m ${remaining}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  if (isToday) {
    return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return `${d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

interface HistoryCardProps {
  entry: CallHistoryEntry;
  index: number;
  onRejoin: (code: string) => void;
}

function HistoryCard({ entry, index, onRejoin }: HistoryCardProps) {
  const ocidIndex = index + 1;
  const isCreator = entry.role === "creator";

  return (
    <motion.div
      data-ocid={`history.item.${ocidIndex}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="glass-dark rounded-2xl p-4"
      style={{
        border: "1px solid oklch(0.22 0.012 260 / 0.6)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isCreator
              ? "oklch(0.2 0.03 195 / 0.5)"
              : "oklch(0.15 0.015 260 / 0.7)",
            border: isCreator
              ? "1px solid oklch(0.75 0.15 195 / 0.2)"
              : "1px solid oklch(0.3 0.012 260 / 0.3)",
          }}
        >
          <PhoneCall
            className="w-4 h-4"
            style={{
              color: isCreator ? "oklch(0.75 0.15 195)" : "oklch(0.6 0.01 260)",
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-geist-mono font-semibold text-sm tracking-widest"
              style={{ color: "oklch(0.92 0.01 260)" }}
            >
              {entry.roomCode}
            </span>
            {/* Role badge */}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={
                isCreator
                  ? {
                      background: "oklch(0.2 0.04 195 / 0.6)",
                      color: "oklch(0.75 0.15 195)",
                      border: "1px solid oklch(0.75 0.15 195 / 0.2)",
                    }
                  : {
                      background: "oklch(0.16 0.01 260 / 0.7)",
                      color: "oklch(0.6 0.01 260)",
                      border: "1px solid oklch(0.3 0.01 260 / 0.3)",
                    }
              }
            >
              {isCreator ? "Creator" : "Joiner"}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: "oklch(0.48 0.008 260)" }}
            >
              <Clock className="w-3 h-3" />
              {formatDateTime(entry.startedAt)}
            </span>
            {(entry.endedAt || !entry.endedAt) && (
              <span
                className="text-xs"
                style={{ color: "oklch(0.42 0.008 260)" }}
              >
                {formatDuration(entry.startedAt, entry.endedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Rejoin */}
        <button
          type="button"
          onClick={() => onRejoin(entry.roomCode)}
          aria-label={`Rejoin room ${entry.roomCode}`}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-100 opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: "oklch(0.18 0.015 260 / 0.8)",
            border: "1px solid oklch(0.32 0.012 260 / 0.5)",
            color: "oklch(0.72 0.01 260)",
          }}
        >
          Rejoin
        </button>
      </div>
    </motion.div>
  );
}

export default function HistoryScreen({
  username,
  onNewCall,
  onBack,
  onRejoin,
}: HistoryScreenProps) {
  const history = useMemo(() => {
    return getCallHistory().filter((e) => e.username === username);
  }, [username]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 10%, oklch(0.55 0.12 195 / 0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 90%, oklch(0.65 0.1 220 / 0.04) 0%, transparent 55%), oklch(0.09 0.005 265)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
        <button
          type="button"
          data-ocid="history.back_button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-100 opacity-60 focus-visible:outline-none focus-visible:ring-2 rounded"
          style={{ color: "oklch(0.75 0.01 260)" }}
          aria-label="Back to dial screen"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          type="button"
          data-ocid="history.new_call_button"
          onClick={onNewCall}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: "oklch(0.75 0.15 195)",
            color: "oklch(0.09 0.005 265)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Call
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col px-6 pb-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <div className="flex items-center gap-2.5 mb-1">
            <History
              className="w-5 h-5"
              style={{ color: "oklch(0.75 0.15 195)" }}
            />
            <h1
              className="text-xl font-semibold"
              style={{ color: "oklch(0.94 0.01 260)" }}
            >
              Recent Calls
            </h1>
          </div>
          <p
            className="text-sm ml-7.5"
            style={{ color: "oklch(0.48 0.008 260)" }}
          >
            {history.length > 0
              ? `${history.length} call${history.length !== 1 ? "s" : ""} in history`
              : "No calls yet"}
          </p>
        </motion.div>

        {/* History list or empty state */}
        {history.length === 0 ? (
          <motion.div
            data-ocid="history.empty_state"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col items-center justify-center gap-4 py-20"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.14 0.01 260 / 0.8)",
                border: "1px solid oklch(0.24 0.012 260 / 0.5)",
              }}
            >
              <History
                className="w-7 h-7"
                style={{ color: "oklch(0.38 0.01 260)" }}
              />
            </div>
            <div className="text-center">
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "oklch(0.65 0.01 260)" }}
              >
                No recent calls
              </p>
              <p className="text-xs" style={{ color: "oklch(0.42 0.008 260)" }}>
                Your call history will appear here
              </p>
            </div>
            <button
              type="button"
              onClick={onNewCall}
              className="mt-2 h-10 px-6 rounded-xl text-sm font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                background: "oklch(0.75 0.15 195)",
                color: "oklch(0.09 0.005 265)",
              }}
            >
              Start a Call
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3 max-w-lg">
            {history.map((entry, index) => (
              <HistoryCard
                key={`${entry.roomCode}_${entry.startedAt}`}
                entry={entry}
                index={index}
                onRejoin={onRejoin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
