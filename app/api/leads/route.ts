import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { activities, leads } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.query.leads.findMany({
    orderBy: [desc(leads.createdAt)],
    with: { activities: { orderBy: [desc(activities.occurredAt)] } },
  });

  return NextResponse.json(
    rows.map((lead) => ({
      ...lead,
      monthlyBilling: Number(lead.monthlyBilling),
      followUpDate: lead.followUpAt ? lead.followUpAt.toISOString().slice(0, 10) : "",
      activities: lead.activities.map((activity) => ({
        id: activity.id,
        createdAt: activity.occurredAt.toISOString(),
        type: activity.type,
        note: activity.description,
      })),
    })),
  );
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.company?.trim() || !body.country?.trim()) {
    return NextResponse.json({ error: "Company and country are required" }, { status: 400 });
  }

  const [lead] = await db
    .insert(leads)
    .values({
      company: body.company.trim(),
      contact: body.contact?.trim() ?? "",
      role: body.role?.trim() ?? "",
      email: body.email?.trim() ?? "",
      linkedin: body.linkedin?.trim() ?? "",
      website: body.website?.trim() ?? "",
      country: body.country.trim(),
      segment: body.segment ?? "DMC",
      stage: "Prospect",
      fitScore: Number(body.fitScore ?? 0),
      monthlyBilling: String(body.monthlyBilling ?? 0),
      nextAction: body.nextAction ?? "Qualify operational need",
      followUpAt: body.followUpDate ? new Date(`${body.followUpDate}T12:00:00Z`) : null,
      referralReference: body.referralReference ?? "",
      notes: body.notes ?? "",
    })
    .returning();

  await db.insert(activities).values({
    leadId: lead.id,
    type: "Created",
    description: "Prospect added to LeadPilot.",
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
