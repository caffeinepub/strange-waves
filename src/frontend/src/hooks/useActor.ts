// Re-export the typed useActor hook pre-bound to the app's Backend actor
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import type { Backend } from "../backend";
import { createActor } from "../backend";

export function useActor(): { actor: Backend | null; isFetching: boolean } {
  return _useActor<Backend>(createActor);
}
