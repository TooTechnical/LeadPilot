"use client";

import { FormEvent, useMemo, useState } from "react";
import { Building2, CircleDollarSign, MessageSquareText, Plus, Search, Target } from "lucide-react";

type Stage = "Prospect" | "Qualified" | "Contacted" | "Interested" | "Referral Registered" | "Proposal" | "Won" | "Lost";

type Lead = {
  id: string;
  company: string;
  contact: string;
  role: string;
  country: string;
  segment: string;
  website: string;
  stage: Stage;
  fitScore: number;
  monthlyBilling: number;
  nextAction: string;
  notes: string;
};

const stages: Stage[] = ["Prospect", "Qualified", "Contacted", "Interested", "Referral Registered", "Proposal", "Won", "Lost"];

const seed: Lead[] = [
  {
    id: "sample-1",
    company: "Sample Ireland DMC",
    contact: "Operations Director",
    role: "Head of Operations",
    country: "Ireland",
    segment: "DMC",
    website: "",
    stage: "Qualified",
    fitScore: 82,
    monthlyBilling: 2595,
    nextAction: "Research booking platforms and personalise outreach",
    notes: "Handles groups and FIT programmes; likely recurring hotel and package operations.",
  },
];

function scoreLead(segment: string, monthlyBilling: number, notes: string): number {
  let score = 35;
  if (["DMC", "Tour Operator", "Wholesaler", "OTA"].includes(segment)) score += 25;
  if (monthlyBilling >= 1000) score += 15;
  if (/hotel|contract|rate|inventory|reservation|group|fit|package/i.test(notes)) score += 20;
  return Math.min(score, 100);
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>(seed);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () => leads.filter((lead) => `${lead.company} ${lead.contact} ${lead.country} ${lead.segment}`.toLowerCase().includes(query.toLowerCase())),
    [leads, query],
  );

  const activePipeline = leads.filter((lead) => !["Won", "Lost"].includes(lead.stage));
  const forecast = leads.reduce((sum, lead) => sum + (lead.stage === "Lost" ? 0 : lead.monthlyBilling * 0.1), 0);
  const won = leads.filter((lead) => lead.stage === "Won").length;

  function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const monthlyBilling = Number(data.get("monthlyBilling") || 1048);
    const notes = String(data.get("notes") || "");
    const segment = String(data.get("segment") || "DMC");
    const lead: Lead = {
      id: crypto.randomUUID(),
      company: String(data.get("company")),
      contact: String(data.get("contact")),
      role: String(data.get("role")),
      country: String(data.get("country")),
      segment,
      website: String(data.get("website")),
      stage: "Prospect",
      fitScore: scoreLead(segment, monthlyBilling, notes),
      monthlyBilling,
      nextAction: "Qualify operational need",
      notes,
    };
    setLeads((current) => [lead, ...current]);
    event.currentTarget.reset();
    setShowForm(false);
  }

  function moveLead(id: string, stage: Stage) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, stage } : lead)));
  }

  return (
    <main>
      <header className="topbar">
        <div><span className="eyebrow">Sales operations</span><h1>LeadPilot</h1><p>Source, qualify and convert travel-industry referral opportunities.</p></div>
        <button className="primary" onClick={() => setShowForm((value) => !value)}><Plus size={18} /> Add lead</button>
      </header>

      <section className="metrics">
        <article><Target /><div><strong>{activePipeline.length}</strong><span>Active opportunities</span></div></article>
        <article><Building2 /><div><strong>{leads.length}</strong><span>Total accounts</span></div></article>
        <article><CircleDollarSign /><div><strong>${forecast.toFixed(2)}</strong><span>Monthly commission forecast</span></div></article>
        <article><MessageSquareText /><div><strong>{won}</strong><span>Closed clients</span></div></article>
      </section>

      {showForm && (
        <form className="lead-form" onSubmit={addLead}>
          <h2>New prospect</h2>
          <input name="company" placeholder="Company name" required />
          <input name="contact" placeholder="Contact name" />
          <input name="role" placeholder="Decision-maker role" />
          <input name="country" placeholder="Country" required />
          <select name="segment" defaultValue="DMC"><option>DMC</option><option>Tour Operator</option><option>Wholesaler</option><option>OTA</option><option>Hotel Group</option><option>Travel Agency</option></select>
          <input name="website" placeholder="Website" type="url" />
          <input name="monthlyBilling" placeholder="Estimated monthly billing" type="number" min="0" defaultValue="1048" />
          <textarea name="notes" placeholder="Why is this company a fit? What buying signals have you found?" />
          <button className="primary" type="submit">Create prospect</button>
        </form>
      )}

      <section className="workspace">
        <div className="toolbar"><div className="search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies, contacts or markets" /></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Account</th><th>Fit</th><th>Stage</th><th>Potential billing</th><th>Commission</th><th>Next action</th></tr></thead>
            <tbody>{filtered.map((lead) => (
              <tr key={lead.id}>
                <td><strong>{lead.company}</strong><span>{lead.segment} · {lead.country}</span><small>{lead.contact}{lead.role ? `, ${lead.role}` : ""}</small></td>
                <td><span className={`score ${lead.fitScore >= 75 ? "high" : ""}`}>{lead.fitScore}</span></td>
                <td><select value={lead.stage} onChange={(event) => moveLead(lead.id, event.target.value as Stage)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></td>
                <td>${lead.monthlyBilling.toLocaleString()}</td>
                <td><strong>${(lead.monthlyBilling * 0.1).toFixed(2)}/mo</strong></td>
                <td>{lead.nextAction}<small>{lead.notes}</small></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
