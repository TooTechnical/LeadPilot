import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!note) return NextResponse.json({ error: "Activity note is required" }, { status: 400 });

  const [activity] = await db
    .insert(activities)
    .values({ leadId: id, type: body.type ?? "Note", description: note })
    .returning();

  return NextResponse.json(
    {
      id: activity.id,
      createdAt: activity.occurredAt.toISOString(),
      type: activity.type,
      note: activity.description,
    },
    { status: 201 },
  );
}
