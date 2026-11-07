"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/** Counts one page view for the owner's insights. Renders nothing. */
export function ViewTracker({ dormId }: { dormId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void createClient().rpc("record_dorm_view", { target_dorm_id: dormId });
  }, [dormId]);
  return null;
}
