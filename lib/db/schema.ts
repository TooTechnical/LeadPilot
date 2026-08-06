import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const leadStage = pgEnum("lead_stage", [
  "Prospect",
  "Qualified",
  "Contacted",
  "Interested",
  "Referral Registered",
  "Proposal",
  "Won",
  "Lost",
]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: text("company").notNull(),
  contact: text("contact").notNull().default(""),
  role: text("role").notNull().default(""),
  email: text("email").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  website: text("website").notNull().default(""),
  country: text("country").notNull(),
  segment: text("segment").notNull(),
  stage: leadStage("stage").notNull().default("Prospect"),
  fitScore: integer("fit_score").notNull().default(0),
  monthlyBilling: numeric("monthly_billing", { precision: 12, scale: 2 }).notNull().default("0"),
  nextAction: text("next_action").notNull().default("Qualify operational need"),
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  referralReference: text("referral_reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const commissions = pgTable("commissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  clientBilling: numeric("client_billing", { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.10"),
  expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }).notNull(),
  receivedAmount: numeric("received_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  billingMonth: text("billing_month").notNull(),
  status: text("status").notNull().default("Expected"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
