import { TripService } from "@/src/domain/trip-service";
import { withAppLock } from "@/src/server/app-lock";
import { SupabaseStore } from "@/src/server/repositories/supabase-store";

export async function withSupabaseTripService<T>(
  activeUserId: string,
  callback: (service: TripService) => T | Promise<T>
): Promise<T> {
  return withAppLock(async () => {
    const store = await SupabaseStore.create(activeUserId);
    const service = new TripService(store);
    const result = await callback(service);
    if (store.isDirty()) {
      await store.flush();
    }
    return result;
  });
}
