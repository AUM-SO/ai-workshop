"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server render and hydration, true afterwards. Owner forms keep their
 * submit buttons off until then, so an early click cannot fall back to a plain GET
 * submit that puts the form data in the URL.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
