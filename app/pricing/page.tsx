"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./pricing.module.css";

type Lead = { id: string; company: string };
type Commission = {
  id: string;
  company: string;
  clientBilling: number;
  commissionRate: number;
  expectedAmount: number;
  receivedAmount: number;
  billingMonth: string;
  status: string;
};

const taskServices = [
  { name: "Hotel Contract Loading", price: 15, unit: "per contract" },
  { name: "Offers and Promotions", price: 8, unit: "per task" },
  { name: "Stop Sale Updates", price: 5, unit: "per task" },
  { name: "Transfers Loading and Management", price: 8, unit: "per task" },
  { name: "Packages Loading and Management", price: 8, unit: "per task" },
  { name: "Reservation Management", price: null, unit: "custom pricing" },
  { name: "Rate Mapping", price: null, unit: "custom pricing" },
  { name: "Double Quality Control", price: 0, unit: "included" },
] as const;

const teamRoles = [
  { name: "Loader", price: 499 },
  { name: "Quality Controller", price: 549 },
] as const;

export default function PricingPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loaders, setLoaders] = useState(1);
  const [qcs, setQcs] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [saving, setSaving] = useState(false);

  const taskTotal = useMemo(
    () =>
      taskServices.reduce(
        (sum, service) => sum + (service.price ?? 0) * (quantities[service.name] ?? 0),
        0,
      ),
    [quantities],
  );

  const teamTotal = loaders * 499 + qcs * 549;
  const combinedQuote = taskTotal + teamTotal;
  const monthlyCommission = combinedQuote * 0.1;

  async function loadData() {
    const [leadResponse, commissionResponse] = await Promise.all([
      fetch("/api/leads", { cache: "no-store" }),
      fetch("/api/commissions", { cache: "no-store" }),
    ]);
    if (leadResponse.ok) {
      const data = await leadResponse.json();
      setLeads(data.map((lead: Lead) => ({ id: lead.id, company: lead.company })));
    }
    if (commissionResponse.ok) setCommissions(await commissionResponse.json());
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function saveCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: data.get("leadId"),
          clientBilling: Number(data.get("clientBilling")),
          commissionRate: 0.1,
          receivedAmount: Number(data.get("receivedAmount") || 0),
          billingMonth: data.get("billingMonth"),
          status: data.get("status"),
        }),
      });
      if (!response.ok) throw new Error("Could not save commission record");
      event.currentTarget.reset();
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  const expectedTotal = commissions.reduce((sum, item) => sum + item.expectedAmount, 0);
  const receivedTotal = commissions.reduce((sum, item) => sum + item.receivedAmount, 0);

  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <div>
          <span className={styles.eyebrow}>TraveSync commercial desk</span>
          <h1>Pricing and commission tracker</h1>
          <p>Build client quotes, explain TraveSync pricing and record your 10% recurring commission.</p>
        </div>
        <Link className={styles.backLink} href="/">Back to leads</Link>
      </div>

      <section className={styles.metrics}>
        <article><span>Current quote</span><strong>${combinedQuote.toFixed(2)}</strong></article>
        <article><span>Your 10% commission</span><strong>${monthlyCommission.toFixed(2)}</strong></article>
        <article><span>Expected commissions</span><strong>${expectedTotal.toFixed(2)}</strong></article>
        <article><span>Received commissions</span><strong>${receivedTotal.toFixed(2)}</strong></article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Task-based services</h2>
          <p>Use quantities to prepare a simple client estimate.</p>
          <div className={styles.serviceList}>
            {taskServices.map((service) => (
              <div className={styles.serviceRow} key={service.name}>
                <div><strong>{service.name}</strong><span>{service.price === null ? "Custom pricing" : service.price === 0 ? "Included" : `$${service.price} ${service.unit}`}</span></div>
                {service.price !== null && service.price > 0 ? (
                  <input
                    aria-label={`${service.name} quantity`}
                    min="0"
                    type="number"
                    value={quantities[service.name] ?? 0}
                    onChange={(event) => setQuantities((current) => ({ ...current, [service.name]: Number(event.target.value) }))}
                  />
                ) : <span className={styles.custom}>Contact TraveSync</span>}
              </div>
            ))}
          </div>
          <div className={styles.totalLine}><span>Task estimate</span><strong>${taskTotal.toFixed(2)}</strong></div>
        </article>

        <article className={styles.card}>
          <h2>Dedicated monthly team</h2>
          <p>Minimum recommended setup: one Loader and one Quality Controller.</p>
          <label>Loaders at ${teamRoles[0].price}/month<input min="0" type="number" value={loaders} onChange={(event) => setLoaders(Number(event.target.value))} /></label>
          <label>Quality Controllers at ${teamRoles[1].price}/month<input min="0" type="number" value={qcs} onChange={(event) => setQcs(Number(event.target.value))} /></label>
          <div className={styles.totalLine}><span>Monthly client price</span><strong>${teamTotal.toFixed(2)}</strong></div>
          <div className={styles.totalLine}><span>Your recurring commission</span><strong>${(teamTotal * 0.1).toFixed(2)}/month</strong></div>
          <div className={styles.examples}>
            <h3>Common examples</h3>
            <span>1 Loader + 1 QC: $1,048</span>
            <span>3 Loaders + 2 QCs: $2,595</span>
            <span>5 Loaders + 3 QCs: $4,641</span>
            <span>10 Loaders + 6 QCs: $8,284</span>
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h2>Record a commission</h2>
        <form className={styles.form} onSubmit={saveCommission}>
          <label>Client<select name="leadId" required defaultValue=""><option value="" disabled>Select a lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company}</option>)}</select></label>
          <label>Client billing<input key={combinedQuote} name="clientBilling" min="0" step="0.01" type="number" defaultValue={combinedQuote} required /></label>
          <label>Billing month<input name="billingMonth" type="month" defaultValue={new Date().toISOString().slice(0, 7)} required /></label>
          <label>Received so far<input name="receivedAmount" min="0" step="0.01" type="number" defaultValue="0" /></label>
          <label>Status<select name="status" defaultValue="Expected"><option>Expected</option><option>Invoiced</option><option>Part Paid</option><option>Paid</option><option>Disputed</option></select></label>
          <button disabled={saving} type="submit">{saving ? "Saving..." : "Save commission"}</button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Commission history</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Client</th><th>Month</th><th>Client billing</th><th>Expected</th><th>Received</th><th>Status</th></tr></thead>
            <tbody>{commissions.map((item) => <tr key={item.id}><td>{item.company}</td><td>{item.billingMonth}</td><td>${item.clientBilling.toFixed(2)}</td><td>${item.expectedAmount.toFixed(2)}</td><td>${item.receivedAmount.toFixed(2)}</td><td>{item.status}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
