import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/server/db/client";
import { getServerTimezone, getServerDailyDateString } from "@/server/scheduling/daily-scheduler";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const isDbConfigured = isDatabaseConfigured();
  const timezone = getServerTimezone();
  const currentDate = getServerDailyDateString();

  return NextResponse.json({
    status: "ok",
    service: "flipped-api",
    timestamp: new Date().toISOString(),
    dailyDate: currentDate,
    timezone,
    database: {
      provider: "postgresql",
      configured: isDbConfigured,
      mode: isDbConfigured ? "live" : "in-memory-fallback",
    },
  });
}
