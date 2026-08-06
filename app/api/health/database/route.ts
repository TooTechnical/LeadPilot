import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.execute(sql`select current_database() as database_name, now() as connected_at`);

    return NextResponse.json({
      ok: true,
      database: result.rows[0] ?? null,
    });
  } catch (error) {
    console.error("Database health check failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
