import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/health — confirms the app can reach the database.
// Not linked from the UI; hit it directly to verify DATABASE_URL works.
export async function GET() {
  try {
    const rows = await query<{ now: string }>("select now()");
    return NextResponse.json({
      status: "ok",
      database: "connected",
      serverTime: rows[0]?.now ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
