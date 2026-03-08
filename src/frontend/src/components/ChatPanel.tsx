import type { ChatMessage } from "@/hooks/useWebRTC";
import { Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useEffect, useRef, useState } from "react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  username: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDisplayName(userId: string): string {
  // userId is formatted as "name_randomhex" — strip the suffix
  const idx = userId.lastIndexOf("_");
  if (idx > 0) return userId.slice(0, idx);
  return userId;
}

export default function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSend,
  username,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages.length triggers scroll, ref mutation is intentional
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    onSend(text);
    setInputValue("");
  };

  // Derive the userId prefix for "is own message" check
  const isOwnMessage = (msgFrom: string) => {
    // userId = "username_randomhex", compare the name part
    const msgName = getDisplayName(msgFrom);
    return msgName === username;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — subtle, doesn't block controls */}
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, oklch(0 0 0 / 0.35) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            key="chat-panel"
            data-ocid="chat.panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 right-0 bottom-0 z-30 flex flex-col"
            style={{
              width: "clamp(280px, 35vw, 380px)",
              background: "oklch(0.1 0.008 260 / 0.92)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              borderLeft: "1px solid oklch(0.28 0.012 260 / 0.6)",
              boxShadow: "-8px 0 40px oklch(0 0 0 / 0.4)",
            }}
            aria-label="In-call chat"
            role="complementary"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                borderBottom: "1px solid oklch(0.22 0.01 260 / 0.6)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "oklch(0.75 0.15 195)" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.9 0.01 260)" }}
                >
                  Chat
                </span>
                {messages.length > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.2 0.03 195 / 0.6)",
                      color: "oklch(0.75 0.15 195)",
                    }}
                  >
                    {messages.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                data-ocid="chat.close_button"
                onClick={onClose}
                aria-label="Close chat"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-100 opacity-60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                style={{
                  background: "oklch(0.18 0.01 260 / 0.8)",
                  border: "1px solid oklch(0.3 0.012 260 / 0.5)",
                  color: "oklch(0.65 0.01 260)",
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "oklch(0.22 0.01 260) transparent",
              }}
            >
              {messages.length === 0 ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center gap-2 py-12"
                  data-ocid="chat.empty_state"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(0.15 0.01 260 / 0.8)",
                      border: "1px solid oklch(0.25 0.01 260 / 0.5)",
                    }}
                  >
                    <Send
                      className="w-4 h-4"
                      style={{ color: "oklch(0.45 0.01 260)" }}
                    />
                  </div>
                  <p
                    className="text-xs text-center"
                    style={{ color: "oklch(0.45 0.01 260)" }}
                  >
                    No messages yet.
                    <br />
                    Say hello!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const own = isOwnMessage(msg.from);
                  const displayName = getDisplayName(msg.from);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex flex-col gap-0.5 ${own ? "items-end" : "items-start"}`}
                    >
                      {/* Sender + time */}
                      <div className="flex items-center gap-1.5">
                        {!own && (
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: "oklch(0.75 0.15 195)" }}
                          >
                            {displayName}
                          </span>
                        )}
                        <span
                          className="text-[10px]"
                          style={{ color: "oklch(0.38 0.008 260)" }}
                        >
                          {formatTime(msg.ts)}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className="max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                        style={
                          own
                            ? {
                                background: "oklch(0.32 0.08 195 / 0.9)",
                                color: "oklch(0.95 0.01 260)",
                                borderBottomRightRadius: "4px",
                              }
                            : {
                                background: "oklch(0.16 0.01 260 / 0.9)",
                                color: "oklch(0.88 0.01 260)",
                                border: "1px solid oklch(0.28 0.012 260 / 0.5)",
                                borderBottomLeftRadius: "4px",
                              }
                        }
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex-shrink-0 px-3 py-3 flex items-center gap-2"
              style={{
                borderTop: "1px solid oklch(0.22 0.01 260 / 0.6)",
              }}
            >
              <input
                ref={inputRef}
                data-ocid="chat.input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message…"
                aria-label="Chat message"
                className="flex-1 h-9 px-3 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
                style={{
                  background: "oklch(0.15 0.01 260 / 0.9)",
                  border: "1px solid oklch(0.28 0.012 260 / 0.6)",
                  color: "oklch(0.92 0.01 260)",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "oklch(0.75 0.15 195 / 0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px oklch(0.75 0.15 195 / 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "oklch(0.28 0.012 260 / 0.6)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                maxLength={500}
                autoComplete="off"
              />
              <button
                type="submit"
                data-ocid="chat.submit_button"
                aria-label="Send message"
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: inputValue.trim()
                    ? "oklch(0.75 0.15 195)"
                    : "oklch(0.18 0.01 260 / 0.8)",
                  color: inputValue.trim()
                    ? "oklch(0.09 0.005 265)"
                    : "oklch(0.45 0.01 260)",
                  border: "1px solid oklch(0.3 0.012 260 / 0.4)",
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
