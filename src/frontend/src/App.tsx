import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import CallScreen from "./components/CallScreen";
import DialScreen from "./components/DialScreen";
import HistoryScreen from "./components/HistoryScreen";
import HomeScreen from "./components/HomeScreen";

export type Screen = "home" | "dial" | "call" | "history";

export interface AppState {
  username: string;
  userId: string;
  roomCode: string;
  isInitiator: boolean;
  screen: Screen;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    username: "",
    userId: "",
    roomCode: "",
    isInitiator: false,
    screen: "home",
  });

  const handleSetUsername = (username: string) => {
    const userId = `${username}_${Math.random().toString(36).slice(2, 8)}`;
    setAppState((prev) => ({ ...prev, username, userId, screen: "dial" }));
  };

  const handleJoinCall = (roomCode: string, isInitiator: boolean) => {
    setAppState((prev) => ({ ...prev, roomCode, isInitiator, screen: "call" }));
  };

  const handleEndCall = () => {
    setAppState((prev) => ({
      ...prev,
      roomCode: "",
      isInitiator: false,
      screen: "dial",
    }));
  };

  const handleBackToHome = () => {
    setAppState((prev) => ({ ...prev, screen: "home" }));
  };

  const handleGoToHistory = () => {
    setAppState((prev) => ({ ...prev, screen: "history" }));
  };

  const handleBackFromHistory = () => {
    setAppState((prev) => ({ ...prev, screen: "dial" }));
  };

  const handleRejoinRoom = async (roomCode: string) => {
    // Navigate to dial screen first, then attempt to join
    setAppState((prev) => ({
      ...prev,
      roomCode,
      isInitiator: false,
      screen: "call",
    }));
  };

  return (
    <div className="min-h-screen bg-background font-sora">
      {appState.screen === "home" && (
        <HomeScreen onSetUsername={handleSetUsername} />
      )}
      {appState.screen === "dial" && (
        <DialScreen
          username={appState.username}
          userId={appState.userId}
          onJoinCall={handleJoinCall}
          onBack={handleBackToHome}
          onGoToHistory={handleGoToHistory}
        />
      )}
      {appState.screen === "call" && (
        <CallScreen
          username={appState.username}
          userId={appState.userId}
          roomCode={appState.roomCode}
          isInitiator={appState.isInitiator}
          onEndCall={handleEndCall}
        />
      )}
      {appState.screen === "history" && (
        <HistoryScreen
          username={appState.username}
          onNewCall={handleBackFromHistory}
          onBack={handleBackFromHistory}
          onRejoin={handleRejoinRoom}
        />
      )}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.01 260)",
            border: "1px solid oklch(0.25 0.015 260)",
            color: "oklch(0.94 0.01 260)",
          },
        }}
      />
    </div>
  );
}
