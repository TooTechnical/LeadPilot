"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, CheckCircle2, CircleDollarSign, ClipboardCopy, Download, MessageSquareText, Plus, Search, Target, Trash2 } from "lucide-react";

type Stage = "Prospect" | "Qualified" | "Contacted" | "Interested" | "Referral Registered" | "Proposal" | "Won" | "Lost";
type Activity = { id: string; createdAt: string; type: string; note: string };
type Lead = {
  id: string; company: string; contact: string; role: string; email: string; linkedin: string; country: string;
  segment: string; website: string; stage: Stage; fitScore: number; monthlyBilling: number; nextAction: string;
  followUpDate: string; referralReference: string; notes: string; activities: Activity[];
};

const stages: Stage[] = ["Prospect", "Qualified", "Contacted", "Interested", "Referral Registered", "Proposal", "Won", "Lost"];

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

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Request failed");
  return response.json();
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState("");

  async function loadLeads(selectId?: string) {
    try {
      setError("");
      const data = (await requestJson("/api/leads")) as Lead[];
      setLeads(data);
      if (selectId) setSelectedId(selectId);
      else if (selectedId && !data.some((lead) => lead.id === selectedId)) setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadLeads(); }, []);

  const filtered = useMemo(() => leads.filter((lead) => `${lead.company} ${lead.contact} ${lead.country} ${lead.segment} ${lead.stage}`.toLowerCase().includes(query.toLowerCase())), [leads, query]);
  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const activePipeline = leads.filter((lead) => !["Won", "Lost"].includes(lead.stage));
  const forecast = leads.reduce((sum, lead) => sum + (lead.stage === "Lost" ? 0 : lead.monthlyBilling * 0.1), 0);
  const won = leads.filter((lead) => lead.stage === "Won").length;
  const followUpsDue = leads.filter((lead) => lead.followUpDate && lead.followUpDate <= new Date().toISOString().slice(0, 10) && !["Won", "Lost"].includes(lead.stage)).length;

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const monthlyBilling = Number(data.get("monthlyBilling") || 1048);
    const notes = String(data.get("notes") || "");
    const segment = String(data.get("segment") || "DMC");
    try {
      const result = await requestJson("/api/leads", { method: "POST", body: JSON.stringify({
        company: String(data.get("company")), contact: String(data.get("contact")), role: String(data.get("role")),
        email: String(data.get("email")), linkedin: String(data.get("linkedin")), country: String(data.get("country")),
        segment, website: String(data.get("website")), monthlyBilling, followUpDate: String(data.get("followUpDate")),
        notes, fitScore: scoreLead(segment, monthlyBilling, notes), nextAction: "Qualify operational need",
      }) });
      form.reset(); setShowForm(false); await loadLeads(result.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create lead"); }
  }

  async function patchLead(id: string, patch: Partial<Lead>) {
    const previous = leads;
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, ...patch } : lead));
    try {
      await requestJson(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await loadLeads(id);
    } catch (err) {
      setLeads(previous); setError(err instanceof Error ? err.message : "Could not update lead");
    }
  }

  async function addActivity() {
    if (!selected || !activityNote.trim()) return;
    try {
      await requestJson(`/api/leads/${selected.id}/activities`, { method: "POST", body: JSON.stringify({ note: activityNote.trim(), type: "Note" }) });
      setActivityNote(""); await loadLeads(selected.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add activity"); }
  }

  async function deleteSelected() {
    if (!selected || !window.confirm(`Delete ${selected.company}?`)) return;
    try {
      await requestJson(`/api/leads/${selected.id}`, { method: "DELETE" });
      setSelectedId(null); await loadLeads();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete lead"); }
  }

  function exportCsv() {
    const headers = ["Company", "Contact", "Role", "Email", "Country", "Segment", "Stage", "Fit score", "Monthly billing", "Commission", "Follow-up", "Referral reference", "Notes"];
    const rows = leads.map((lead) => [lead.company, lead.contact, lead.role, lead.email, lead.country, lead.segment, lead.stage, lead.fitScore, lead.monthlyBilling, (lead.monthlyBilling * 0.1).toFixed(2), lead.followUpDate, lead.referralReference, lead.notes]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `leadpilot-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <main>
    <header className="topbar"><div><span className="eyebrow">Sales operations</span><h1>LeadPilot</h1><p>Source, qualify and convert travel-industry referral opportunities.</p></div><div className="header-actions"><button className="secondary" onClick={exportCsv}><Download size={18}/> Export CSV</button><button className="primary" onClick={() => setShowForm((value) => !value)}><Plus size={18}/> Add lead</button></div></header>
    {error && <p className="error-banner">{error}</p>}
    <section className="metrics"><article><Target/><div><strong>{activePipeline.length}</strong><span>Active opportunities</span></div></article><article><Building2/><div><strong>{leads.length}</strong><span>Total accounts</span></div></article><article><CircleDollarSign/><div><strong>${forecast.toFixed(2)}</strong><span>Monthly commission forecast</span></div></article><article><CalendarClock/><div><strong>{followUpsDue}</strong><span>Follow-ups due</span></div></article><article><MessageSquareText/><div><strong>{won}</strong><span>Closed clients</span></div></article></section>
    {showForm && <form className="lead-form" onSubmit={addLead}><h2>New prospect</h2><input name="company" placeholder="Company name" required/><input name="contact" placeholder="Contact name"/><input name="role" placeholder="Decision-maker role"/><input name="email" placeholder="Email" type="email"/><input name="linkedin" placeholder="LinkedIn URL" type="url"/><input name="country" placeholder="Country" required/><select name="segment" defaultValue="DMC"><option>DMC</option><option>Tour Operator</option><option>Wholesaler</option><option>OTA</option><option>Hotel Group</option><option>Travel Agency</option></select><input name="website" placeholder="Website" type="url"/><input name="monthlyBilling" type="number" min="0" defaultValue="1048"/><input name="followUpDate" type="date"/><textarea name="notes" placeholder="Why is this company a fit? What buying signals have you found?"/><button className="primary" type="submit">Create prospect</button></form>}
    <section className="workspace"><div className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies, contacts, stages or markets"/></div></div><div className="table-wrap"><table><thead><tr><th>Account</th><th>Fit</th><th>Stage</th><th>Potential billing</th><th>Commission</th><th>Follow-up</th><th>Next action</th></tr></thead><tbody>{loading ? <tr><td colSpan={7}>Loading Neon records...</td></tr> : filtered.map((lead) => <tr key={lead.id} className={selectedId === lead.id ? "selected-row" : ""} onClick={() => setSelectedId(lead.id)}><td><strong>{lead.company}</strong><span>{lead.segment} · {lead.country}</span><small>{lead.contact}{lead.role ? `, ${lead.role}` : ""}</small></td><td><span className={`score ${lead.fitScore >= 75 ? "high" : ""}`}>{lead.fitScore}</span></td><td onClick={(event) => event.stopPropagation()}><select value={lead.stage} onChange={(event) => void patchLead(lead.id, { stage: event.target.value as Stage })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></td><td>${lead.monthlyBilling.toLocaleString()}</td><td><strong>${(lead.monthlyBilling * .1).toFixed(2)}/mo</strong></td><td>{lead.followUpDate || "Not set"}</td><td>{lead.nextAction}<small>{lead.notes}</small></td></tr>)}</tbody></table></div></section>
    {selected && <aside className="detail-panel"><div className="detail-header"><div><span className="eyebrow">Opportunity workspace</span><h2>{selected.company}</h2><p>{selected.segment} · {selected.country}</p></div><button className="danger" onClick={() => void deleteSelected()}><Trash2 size={17}/> Delete</button></div><div className="detail-grid"><label>Next action<input value={selected.nextAction} onChange={(event) => setLeads((current) => current.map((lead) => lead.id === selected.id ? { ...lead, nextAction: event.target.value } : lead))} onBlur={() => void patchLead(selected.id, { nextAction: selected.nextAction })}/></label><label>Follow-up date<input type="date" value={selected.followUpDate} onChange={(event) => void patchLead(selected.id, { followUpDate: event.target.value })}/></label><label>Referral reference<input value={selected.referralReference} onChange={(event) => setLeads((current) => current.map((lead) => lead.id === selected.id ? { ...lead, referralReference: event.target.value } : lead))} onBlur={() => void patchLead(selected.id, { referralReference: selected.referralReference })}/></label><label>Estimated monthly billing<input type="number" min="0" value={selected.monthlyBilling} onChange={(event) => void patchLead(selected.id, { monthlyBilling: Number(event.target.value) })}/></label></div><section className="outreach-card"><div className="section-title"><h3>Generated outreach</h3><button className="secondary" onClick={() => void navigator.clipboard.writeText(createOutreach(selected))}><ClipboardCopy size={16}/> Copy</button></div><pre>{createOutreach(selected)}</pre></section><section className="activity-card"><div className="section-title"><h3>Activity timeline</h3><CheckCircle2 size={18}/></div><div className="activity-entry"><input value={activityNote} onChange={(event) => setActivityNote(event.target.value)} placeholder="Add a call note, reply or next step" onKeyDown={(event) => { if (event.key === "Enter") void addActivity(); }}/><button className="primary" onClick={() => void addActivity()}>Add</button></div><div className="timeline">{selected.activities.map((activity) => <article key={activity.id}><strong>{activity.type}</strong><span>{new Date(activity.createdAt).toLocaleString()}</span><p>{activity.note}</p></article>)}</div></section></aside>}
  </main>;
}
