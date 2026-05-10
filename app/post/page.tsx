"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const PRICING = {
  base: 299,
  highlight: 49,
  sticky7: 149,
  logo: 49
};

export default function PostJob() {
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const total = PRICING.base;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!position.trim() || !company.trim() || !email.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: position.trim(),
          company: company.trim(),
          email: email.trim()
        })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to create checkout session");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">JC</span>
          <span>
            <strong>JobCollar</strong>
            <small>real trade jobs</small>
          </span>
        </Link>
        <nav aria-label="Primary">
          <Link href="/">Jobs</Link>
          <Link className="post-job-btn" href="/post">Post a job</Link>
        </nav>
      </header>

      <section className="post-shell">
        <div className="post-hero">
          <h1>Hire skilled tradespeople</h1>
          <p>
            Reach thousands of electricians, mechanics, welders, nurses, CDL drivers,
            and other skilled workers actively looking for their next role.
          </p>
        </div>

        <form className="post-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Job details</h2>

            <label className="form-field">
              <span>Position title *</span>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. HVAC Technician, Diesel Mechanic, CNA"
                required
              />
            </label>

            <label className="form-field">
              <span>Company name *</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
                required
              />
            </label>

            <label className="form-field">
              <span>Company email *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hiring@yourcompany.com"
                required
              />
            </label>
          </div>

          <div className="form-section pricing-section">
            <h2>Pricing</h2>
            <div className="price-card">
              <div className="price-line">
                <span>30-day job post</span>
                <strong>${PRICING.base}</strong>
              </div>
              <ul className="price-perks">
                <li>Shown to thousands of skilled trade job seekers</li>
                <li>Highlighted in relevant trade categories</li>
                <li>Live for 30 days</li>
                <li>Secure payment via Stripe</li>
              </ul>
              <div className="price-total">
                <span>Total</span>
                <strong>${total}</strong>
              </div>
            </div>
          </div>

          <button className="checkout-btn" type="submit" disabled={loading}>
            {loading ? "Redirecting to payment..." : `Post job — $${total}`}
          </button>
          <p className="checkout-note">
            Secure payment powered by Stripe. Your job post goes live immediately after payment.
          </p>
        </form>
      </section>
    </main>
  );
}
