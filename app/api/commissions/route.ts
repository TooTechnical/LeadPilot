import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { commissions, leads } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: commissions.id,
      leadId: commissions.leadId,
      company: leads.company,
      clientBilling: commissions.clientBilling,
      commissionRate: commissions.commissionRate,
      expectedAmount: commissions.expectedAmount,
      receivedAmount: commissions.receivedAmount,
      billingMonth: commissions.billingMonth,
      status: commissions.status,
      createdAt: commissions.createdAt,
    })
    .from(commissions)
    .innerJoin(leads, eq(commissions.leadId, leads.id))
    .orderBy(desc(commissions.createdAt));

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      clientBilling: Number(row.clientBilling),
      commissionRate: Number(row.commissionRate),
      expectedAmount: Number(row.expectedAmount),
      receivedAmount: Number(row.receivedAmount),
      createdAt: row.createdAt.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const clientBilling = Number(body.clientBilling ?? 0);
  const commissionRate = Number(body.commissionRate ?? 0.1);

  if (!body.leadId || clientBilling < 0 || commissionRate < 0) {
    return NextResponse.json({ error: "A lead and valid amounts are required" }, { status: 400 });
  }

  const [record] = await db
    .insert(commissions)
    .values({
      leadId: body.leadId,
      clientBilling: String(clientBilling),
      commissionRate: String(commissionRate),
      expectedAmount: String(clientBilling * commissionRate),
      receivedAmount: String(Number(body.receivedAmount ?? 0)),
      billingMonth: body.billingMonth || new Date().toISOString().slice(0, 7),
      status: body.status || "Expected",
    })
    .returning({ id: commissions.id });

  return NextResponse.json(record, { status: 201 });
}
