import React from "react";

const PLAY_COUNTS_KEY = "sw_play_counts";

export function getPlayCount(id: string): number {
  try {
    const stored = localStorage.getItem(PLAY_COUNTS_KEY);
    const counts: Record<string, number> = stored ? JSON.parse(stored) : {};
    return counts[id] ?? 0;
  } catch {
    return 0;
  }
}

export function incrementPlayCount(id: string): void {
  try {
    const stored = localStorage.getItem(PLAY_COUNTS_KEY);
    const counts: Record<string, number> = stored ? JSON.parse(stored) : {};
    counts[id] = (counts[id] ?? 0) + 1;
    localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(counts));
    window.dispatchEvent(new CustomEvent("sw_play_count_updated"));
  } catch {}
}

export function usePlayCount(id: string | undefined): number {
  const [count, setCount] = React.useState(() => (id ? getPlayCount(id) : 0));
  React.useEffect(() => {
    if (!id) return;
    const handler = () => setCount(getPlayCount(id));
    window.addEventListener("sw_play_count_updated", handler);
    return () => window.removeEventListener("sw_play_count_updated", handler);
  }, [id]);
  return count;
}
