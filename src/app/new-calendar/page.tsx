"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

async function createUniqueSession() {
  let sessionId;
  let isUnique = false;
  while (!isUnique) {
    sessionId = Math.random().toString(36).slice(2, 10);
    // Check with API if sessionId is available
    const res = await fetch(`/api/calendar/${sessionId}/check`, { method: "GET" });
    let data = { available: false };
    try {
      data = await res.json();
    } catch {
      // If response is not JSON, treat as unavailable
      data = { available: false };
    }
    if (data.available) {
      // Insert new calendar in DB
      const createRes = await fetch(`/api/calendar/${sessionId}/create`, { method: "POST" });
      let createData = { success: false };
      try {
        createData = await createRes.json();
      } catch {
        createData = { success: false };
      }
      if (createData.success) {
        isUnique = true;
      }
    }
  }
  return sessionId;
}

export default function NewCalendar() {
  const router = useRouter();

  useEffect(() => {
    createUniqueSession().then((sessionId) => {
      router.replace(`/calendar/${sessionId}`);
    });
  }, [router]);

  return null;
}
