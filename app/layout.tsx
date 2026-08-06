import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadPilot",
  description: "Travel referral sales operations dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav
          aria-label="LeadPilot navigation"
          style={{
            display: "flex",
            gap: "18px",
            alignItems: "center",
            padding: "14px 32px",
            borderBottom: "1px solid #e4e7ec",
            background: "#ffffff",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <strong style={{ marginRight: "auto" }}>LeadPilot</strong>
          <Link href="/" style={{ color: "#101828", textDecoration: "none", fontWeight: 700 }}>
            Leads
          </Link>
          <Link href="/pricing" style={{ color: "#101828", textDecoration: "none", fontWeight: 700 }}>
            Pricing & commissions
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
