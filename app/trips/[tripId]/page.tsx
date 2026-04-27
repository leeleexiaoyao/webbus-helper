"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  useEffect(() => {
    // 直接重定向到工具页面，因为这个页面已经被废弃
    router.push(`/tools`);
  }, [router, tripId]);

  return null;
}
