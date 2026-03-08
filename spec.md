# FreeCall

## Current State
A WebRTC peer-to-peer video/audio calling app with three screens:
- **HomeScreen**: Enter display name to get started.
- **DialScreen**: Create a new room or join an existing room by code.
- **CallScreen**: Full-screen video call with local PiP, remote video, mute/camera/end controls, and room code display.

The backend handles room management and WebRTC signaling via `sendSignal` / `getPendingSignals` / `clearSignals`. The `useWebRTC` hook manages peer connections and polls signals every 1500ms.

## Requested Changes (Diff)

### Add
1. **In-call text chat panel** -- A slide-in panel on the CallScreen that users can toggle open/closed during a call. Messages are sent and received via the existing signaling channel (using a `chat:` prefix on signal data to distinguish from WebRTC signals). Messages include: sender username, message text, and timestamp. The panel shows a scrollable message list, a text input field, and a send button. A chat toggle button is added to the controls toolbar.
2. **Recent calls history screen** -- A new screen (between DialScreen and home) that shows the last 10 calls the user has made or joined, stored in `localStorage`. Each entry shows: room code, date/time, duration (if known), and whether they were the creator or joiner. A "New Call" button leads to DialScreen. Entries can be clicked to rejoin a room (which attempts to join with the existing code).

### Modify
- **CallScreen**: Add chat toggle button to the controls toolbar. Render the sliding chat panel overlay. Track and persist call history entry (room code, start time, role) to `localStorage` on mount and calculate duration on unmount.
- **DialScreen**: Add a "Recent Calls" button/link that navigates to the history screen.
- **App.tsx**: Add `"history"` as a valid Screen type. Add routing logic to handle the history screen.
- **useWebRTC hook**: Expose a `sendChatMessage` function and a `chatMessages` array. Intercept incoming signals prefixed with `chat:` and parse them as chat messages instead of WebRTC signals.

### Remove
- Nothing removed.

## Implementation Plan
1. Extend `App.tsx` Screen type to include `"history"`.
2. Add `handleGoToHistory` and `handleBackFromHistory` navigation handlers in `App.tsx`.
3. Create `src/utils/callHistory.ts` -- helpers to read/write call history entries to `localStorage`.
4. Create `src/components/HistoryScreen.tsx` -- recent calls list, empty state, rejoin button per entry, "New Call" CTA.
5. Update `useWebRTC.ts` -- add `chatMessages` state, `sendChatMessage` function, and intercept `chat:`-prefixed signals in `processSignals`.
6. Create `src/components/ChatPanel.tsx` -- slide-in panel with message list, input, and send button.
7. Update `CallScreen.tsx` -- add chat toggle button to toolbar, render `ChatPanel`, save/restore call history on mount/unmount.
8. Update `DialScreen.tsx` -- add "Recent Calls" button that navigates to history screen.
9. Apply deterministic `data-ocid` markers to all new interactive surfaces.
