"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCopy,
  Download,
  MessageSquareText,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react";

type Stage =
  | "Prospect"
  | "Qualified"
  | "Contacted"
  | "Interested"
  | "Referral Registered"
  | "Proposal"
  | "Won"
  | "Lost";

type Activity = {
  id: string;
  createdAt: string;
  type: string;
  note: string;
};

type Lead = {
  id: string;
  company: string;
  contact: string;
  role: string;
  email: string;
  linkedin: string;
  country: string;
  segment: string;
  website: string;
  stage: Stage;
  fitScore: number;
  monthlyBilling: number;
  nextAction: string;
  followUpDate: string;
  referralReference: string;
  notes: string;
  activities: Activity[];
};

const STORAGE_KEY = "leadpilot.leads.v1";
const stages: Stage[] = [
  "Prospect",
  "Qualified",
  "Contacted",
  "Interested",
  "Referral Registered",
  "Proposal",
  "Won",
  "Lost",
];

const seed: Lead[] = [
  {
    id: "sample-1",
    company: "Sample Ireland DMC",
    contact: "Operations Director",
    role: "Head of Operations",
    email: "",
    linkedin: "",
    country: "Ireland",
    segment: "DMC",
    website: "",
    stage: "Qualified",
    fitScore: 82,
    monthlyBilling: 2595,
    nextAction: "Research booking platforms and personalise outreach",
    followUpDate: "",
    referralReference: "",
    notes: "Handles groups and FIT programmes; likely recurring hotel and package operations.",
    activities: [
      {
        id: "sample-activity",
        createdAt: new Date().toISOString(),
        type: "Research",
        note: "Sample account created to demonstrate the qualification workflow.",
      },
    ],
  },
];

function scoreLead(segment: string, monthlyBilling: number, notes: string): number {
  let score = 30;
  if (["DMC", "Tour Operator", "Wholesaler", "OTA"].includes(segment)) score += 25;
  if (monthlyBilling >= 1000) score += 15;
  if (monthlyBilling >= 2500) score += 10;
  if (/hotel|contract|rate|inventory|reservation|group|fit|package|stop sale/i.test(notes)) score += 20;
  return Math.min(score, 100);
}

function createOutreach(lead: Lead): string {
  const name = lead.contact || "there";
  const observation = lead.notes
    ? `I noticed that ${lead.company} ${lead.notes.charAt(0).toLowerCase()}${lead.notes.slice(1)}`
    : `I noticed that ${lead.company} operates in the ${lead.segment.toLowerCase()} market.`;

  return `Hi ${name},\n\n${observation}\n\nI work with TraveSync, a specialist travel backend operations provider supporting DMCs and tour operators with hotel contract loading, rate mapping, offers, stop-sale updates, reservations, transfers, packages and independent quality checking.\n\nDoes your team currently handle all of this internally, or do backend capacity and seasonal workloads ever become a bottleneck?\n\nThere may be an opportunity to add dedicated operational support without recruiting and training additional permanent staff. Would you be open to a brief introductory conversation?\n\nKind regards,\nDillon Malone`;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>(seed);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLeads(JSON.parse(stored) as Lead[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [hydrated, leads]);

  const filtered = useMemo(
    () =>
      leads.filter((lead) =>
        `${lead.company} ${lead.contact} ${lead.country} ${lead.segment} ${lead.stage}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [leads, query],
  );

  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const activePipeline = leads.filter((lead) => !["Won", "Lost"].includes(lead.stage));
  const forecast = leads.reduce((sum, lead) => sum + (lead.stage === "Lost" ? 0 : lead.monthlyBilling * 0.1), 0);
  const won = leads.filter((lead) => lead.stage === "Won").length;
  const followUpsDue = leads.filter(
    (lead) => lead.followUpDate && lead.followUpDate <= new Date().toISOString().slice(0, 10) && !["Won", "Lost"].includes(lead.stage),
  ).length;

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
      email: String(data.get("email")),
      linkedin: String(data.get("linkedin")),
      country: String(data.get("country")),
      segment,
      website: String(data.get("website")),
      stage: "Prospect",
      fitScore: scoreLead(segment, monthlyBilling, notes),
      monthlyBilling,
      nextAction: "Qualify operational need",
      followUpDate: String(data.get("followUpDate")),
      referralReference: "",
      notes,
      activities: [
        { id: crypto.randomUUID(), createdAt: new Date().toISOString(), type: "Created", note: "Prospect added to LeadPilot." },
      ],
    };
    setLeads((current) => [lead, ...current]);
    setSelectedId(lead.id);
    event.currentTarget.reset();
    setShowForm(false);
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }

  function moveLead(id: string, stage: Stage) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              stage,
              activities: [
                { id: crypto.randomUUID(), createdAt: new Date().toISOString(), type: "Stage", note: `Moved to ${stage}.` },
                ...lead.activities,
              ],
            }
          : lead,
      ),
    );
  }

  function addActivity() {
    if (!selected || !activityNote.trim()) return;
    updateLead(selected.id, {
      activities: [
        { id: crypto.randomUUID(), createdAt: new Date().toISOString(), type: "Note", note: activityNote.trim() },
        ...selected.activities,
      ],
    });
    setActivityNote("");
  }

  function exportCsv() {
    const headers = ["Company", "Contact", "Role", "Email", "Country", "Segment", "Stage", "Fit score", "Monthly billing", "Commission", "Follow-up", "Referral reference", "Notes"];
    const rows = leads.map((lead) => [
      lead.company,
      lead.contact,
      lead.role,
      lead.email,
      lead.country,
      lead.segment,
      lead.stage,
      lead.fitScore,
      lead.monthlyBilling,
      (lead.monthlyBilling * 0.1).toFixed(2),
      lead.followUpDate,
      lead.referralReference,
      lead.notes,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leadpilot-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyOutreach() {
    if (!selected) return;
    await navigator.clipboard.writeText(createOutreach(selected));
  }

  function deleteSelected() {
    if (!selected || !window.confirm(`Delete ${selected.company}?`)) return;
    setLeads((current) => current.filter((lead) => lead.id !== selected.id));
    setSelectedId(null);
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <span className="eyebrow">Sales operations</span>
          <h1>LeadPilot</h1>
          <p>Source, qualify and convert travel-industry referral opportunities.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={exportCsv}><Download size={18} /> Export CSV</button>
          <button className="primary" onClick={() => setShowForm((value) => !value)}><Plus size={18} /> Add lead</button>
        </div>
      </header>

      <section className="metrics">
        <article><Target /><div><strong>{activePipeline.length}</strong><span>Active opportunities</span></div></article>
        <article><Building2 /><div><strong>{leads.length}</strong><span>Total accounts</span></div></article>
        <article><CircleDollarSign /><div><strong>${forecast.toFixed(2)}</strong><span>Monthly commission forecast</span></div></article>
        <article><CalendarClock /><div><strong>{followUpsDue}</strong><span>Follow-ups due</span></div></article>
        <article><MessageSquareText /><div><strong>{won}</strong><span>Closed clients</span></div></article>
      </section>

      {showForm && (
        <form className="lead-form" onSubmit={addLead}>
          <h2>New prospect</h2>
          <input name="company" placeholder="Company name" required />
          <input name="contact" placeholder="Contact name" />
          <input name="role" placeholder="Decision-maker role" />
          <input name="email" placeholder="Email" type="email" />
          <input name="linkedin" placeholder="LinkedIn URL" type="url" />
          <input name="country" placeholder="Country" required />
          <select name="segment" defaultValue="DMC"><option>DMC</option><option>Tour Operator</option><option>Wholesaler</option><option>OTA</option><option>Hotel Group</option><option>Travel Agency</option></select>
          <input name="website" placeholder="Website" type="url" />
          <input name="monthlyBilling" placeholder="Estimated monthly billing" type="number" min="0" defaultValue="1048" />
          <input name="followUpDate" type="date" aria-label="Follow-up date" />
          <textarea name="notes" placeholder="Why is this company a fit? What buying signals have you found?" />
          <button className="primary" type="submit">Create prospect</button>
        </form>
      )}

      <section className="workspace">
        <div className="toolbar">
          <div className="search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies, contacts, stages or markets" /></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Account</th><th>Fit</th><th>Stage</th><th>Potential billing</th><th>Commission</th><th>Follow-up</th><th>Next action</th></tr></thead>
            <tbody>{filtered.map((lead) => (
              <tr key={lead.id} className={selectedId === lead.id ? "selected-row" : ""} onClick={() => setSelectedId(lead.id)}>
                <td><strong>{lead.company}</strong><span>{lead.segment} · {lead.country}</span><small>{lead.contact}{lead.role ? `, ${lead.role}` : ""}</small></td>
                <td><span className={`score ${lead.fitScore >= 75 ? "high" : ""}`}>{lead.fitScore}</span></td>
                <td onClick={(event) => event.stopPropagation()}><select value={lead.stage} onChange={(event) => moveLead(lead.id, event.target.value as Stage)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></td>
                <td>${lead.monthlyBilling.toLocaleString()}</td>
                <td><strong>${(lead.monthlyBilling * 0.1).toFixed(2)}/mo</strong></td>
                <td>{lead.followUpDate || "Not set"}</td>
                <td>{lead.nextAction}<small>{lead.notes}</small></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {selected && (
        <aside className="detail-panel">
          <div className="detail-header">
            <div><span className="eyebrow">Opportunity workspace</span><h2>{selected.company}</h2><p>{selected.segment} · {selected.country}</p></div>
            <button className="danger" onClick={deleteSelected}><Trash2 size={17} /> Delete</button>
          </div>

          <div className="detail-grid">
            <label>Next action<input value={selected.nextAction} onChange={(event) => updateLead(selected.id, { nextAction: event.target.value })} /></label>
            <label>Follow-up date<input type="date" value={selected.followUpDate} onChange={(event) => updateLead(selected.id, { followUpDate: event.target.value })} /></label>
            <label>Referral reference<input value={selected.referralReference} onChange={(event) => updateLead(selected.id, { referralReference: event.target.value })} placeholder="TraveSync confirmation or CRM ID" /></label>
            <label>Estimated monthly billing<input type="number" min="0" value={selected.monthlyBilling} onChange={(event) => updateLead(selected.id, { monthlyBilling: Number(event.target.value) })} /></label>
          </div>

          <section className="outreach-card">
            <div className="section-title"><h3>Generated outreach</h3><button className="secondary" onClick={copyOutreach}><ClipboardCopy size={16} /> Copy</button></div>
            <pre>{createOutreach(selected)}</pre>
          </section>

          <section className="activity-card">
            <div className="section-title"><h3>Activity timeline</h3><CheckCircle2 size={18} /></div>
            <div className="activity-entry"><input value={activityNote} onChange={(event) => setActivityNote(event.target.value)} placeholder="Add a call note, reply or next step" onKeyDown={(event) => { if (event.key === "Enter") addActivity(); }} /><button className="primary" onClick={addActivity}>Add</button></div>
            <div className="timeline">
              {selected.activities.map((activity) => (
                <article key={activity.id}><strong>{activity.type}</strong><span>{new Date(activity.createdAt).toLocaleString()}</span><p>{activity.note}</p></article>
              ))}
            </div>
          </section>
        </aside>
      )}
    </main>
  );
}
