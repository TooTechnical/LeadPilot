import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { activities, leads } from "@/lib/db/schema";

const validStages = new Set([
  "Prospect",
  "Qualified",
  "Contacted",
  "Interested",
  "Referral Registered",
  "Proposal",
  "Won",
  "Lost",
]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.nextAction === "string") patch.nextAction = body.nextAction;
  if (typeof body.referralReference === "string") patch.referralReference = body.referralReference;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.monthlyBilling === "number") patch.monthlyBilling = String(body.monthlyBilling);
  if (typeof body.followUpDate === "string") {
    patch.followUpAt = body.followUpDate ? new Date(`${body.followUpDate}T12:00:00Z`) : null;
  }

  if (typeof body.stage === "string") {
    if (!validStages.has(body.stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    patch.stage = body.stage;
  }

  const [updated] = await db.update(leads).set(patch).where(eq(leads.id, id)).returning({ id: leads.id });
  if (!updated) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (typeof body.stage === "string") {
    await db.insert(activities).values({ leadId: id, type: "Stage", description: `Moved to ${body.stage}.` });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [deleted] = await db.delete(leads).where(eq(leads.id, id)).returning({ id: leads.id });
  if (!deleted) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
