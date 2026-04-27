import crypto from "crypto";
import { getSupabaseAdmin } from "@/src/server/supabase";

const DEFAULT_LOCK_KEY = "trip-service-global";
const LOCK_TOOL_TYPE = "__app_lock__";
const LOCK_TTL_MS = 15_000;
const LOCK_WAIT_TIMEOUT_MS = 10_000;
const LOCK_RETRY_INTERVAL_MS = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withAppLock<T>(
  callback: () => Promise<T>,
  lockKey = DEFAULT_LOCK_KEY
): Promise<T> {
  const supabaseAdmin = getSupabaseAdmin();
  const ownerId = crypto.randomUUID();
  const deadline = Date.now() + LOCK_WAIT_TIMEOUT_MS;
  let acquired = false;
  let ownerExpiresAt = 0;

  while (!acquired) {
    const now = Date.now();
    ownerExpiresAt = now + LOCK_TTL_MS;
    const { error } = await supabaseAdmin.from("tool_states").insert({
      trip_id: `__lock__:${lockKey}`,
      tool_type: LOCK_TOOL_TYPE,
      state_json: { owner_id: ownerId },
      updated_at: ownerExpiresAt,
    });

    if (!error) {
      acquired = true;
      break;
    }

    if ((error as { code?: string }).code !== "23505") {
      throw error;
    }

    const { error: cleanupError } = await supabaseAdmin
      .from("tool_states")
      .delete()
      .eq("trip_id", `__lock__:${lockKey}`)
      .eq("tool_type", LOCK_TOOL_TYPE)
      .lte("updated_at", now);

    if (cleanupError) {
      throw cleanupError;
    }

    if (Date.now() >= deadline) {
      throw new Error("APP_LOCK_TIMEOUT");
    }

    await sleep(LOCK_RETRY_INTERVAL_MS);
  }

  try {
    return await callback();
  } finally {
    await supabaseAdmin
      .from("tool_states")
      .delete()
      .eq("trip_id", `__lock__:${lockKey}`)
      .eq("tool_type", LOCK_TOOL_TYPE)
      .eq("updated_at", ownerExpiresAt);
  }
}
