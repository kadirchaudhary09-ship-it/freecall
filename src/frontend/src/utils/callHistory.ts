const STORAGE_KEY = "freecall_history";
const MAX_ENTRIES = 20;

export interface CallHistoryEntry {
  roomCode: string;
  startedAt: number; // Date.now()
  endedAt?: number;
  role: "creator" | "joiner";
  username: string;
}

export function getCallHistory(): CallHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CallHistoryEntry[];
  } catch {
    return [];
  }
}

export function addCallEntry(entry: CallHistoryEntry): void {
  try {
    const history = getCallHistory();
    // Prepend new entry
    const updated = [entry, ...history].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function updateCallEntry(
  roomCode: string,
  startedAt: number,
  patch: Partial<CallHistoryEntry>,
): void {
  try {
    const history = getCallHistory();
    const idx = history.findIndex(
      (e) => e.roomCode === roomCode && e.startedAt === startedAt,
    );
    if (idx === -1) return;
    history[idx] = { ...history[idx], ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail
  }
}
