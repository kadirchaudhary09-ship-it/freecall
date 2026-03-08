import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneCall } from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";

interface HomeScreenProps {
  onSetUsername: (username: string) => void;
}

export default function HomeScreen({ onSetUsername }: HomeScreenProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a display name to continue.");
      return;
    }
    onSetUsername(trimmed);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background mesh gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.65 0.14 195 / 0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, oklch(0.62 0.22 25 / 0.06) 0%, transparent 55%), oklch(0.09 0.005 265)",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.75 0.15 195) 1px, transparent 1px), linear-gradient(90deg, oklch(0.75 0.15 195) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <main className="relative z-10 w-full max-w-sm mx-auto px-6 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center glow-teal"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.2 0.03 195), oklch(0.14 0.015 260))",
                border: "1px solid oklch(0.75 0.15 195 / 0.35)",
              }}
            >
              <PhoneCall
                className="w-9 h-9"
                style={{ color: "oklch(0.75 0.15 195)" }}
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="text-center">
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.94 0.01 260) 0%, oklch(0.75 0.15 195) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FreeCall
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "oklch(0.55 0.01 260)" }}
            >
              Free voice &amp; video calls, anywhere
            </p>
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <form
            onSubmit={handleSubmit}
            className="glass-dark rounded-2xl p-6 flex flex-col gap-4"
          >
            <div>
              <label
                htmlFor="username-input"
                className="block text-sm font-medium mb-2"
                style={{ color: "oklch(0.75 0.01 260)" }}
              >
                Your display name
              </label>
              <Input
                id="username-input"
                data-ocid="home.input"
                type="text"
                placeholder="Enter your display name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
                autoComplete="nickname"
                className="h-11 rounded-xl text-base"
                style={{
                  background: "oklch(0.12 0.008 260)",
                  border: "1px solid oklch(0.28 0.015 260)",
                  color: "oklch(0.94 0.01 260)",
                  fontSize: "16px",
                }}
              />
              {error && (
                <p
                  className="mt-2 text-xs"
                  style={{ color: "oklch(0.72 0.18 25)" }}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <Button
              data-ocid="home.primary_button"
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: "oklch(0.75 0.15 195)",
                color: "oklch(0.09 0.005 265)",
              }}
            >
              Get Started
            </Button>
          </form>

          <p
            className="mt-4 text-center text-xs"
            style={{ color: "oklch(0.4 0.008 260)" }}
          >
            No account required. Calls are peer-to-peer.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs" style={{ color: "oklch(0.35 0.008 260)" }}>
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-opacity hover:opacity-100 opacity-70"
            style={{ color: "oklch(0.5 0.01 260)" }}
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
