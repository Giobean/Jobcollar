"use client";

import Image from "next/image";
import { Check, LockKeyhole, Upload } from "lucide-react";
import { useState } from "react";
import { AdSpace, PLATFORM_FEE_RATE } from "@/lib/data";

export function CheckoutForm({ space }: { space: AdSpace }) {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const fee = Math.round(space.price * PLATFORM_FEE_RATE * 100) / 100;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileName) {
      setStatus("Choose your advertisement artwork before continuing.");
      return;
    }
    setStatus("Opening secure Stripe Checkout…");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adSpaceId: space.id }),
      });
      const body = await response.json();
      if (body.url) window.location.href = body.url;
      else setStatus(body.message ?? "Checkout is ready once Stripe environment variables are configured.");
    } catch {
      setStatus("Checkout could not be started. Please try again.");
    }
  }

  return (
    <div className="checkout-shell shell">
      <header className="checkout-heading"><span>1</span><div><p>Request artwork</p><h1>Make it physical.</h1><p>Upload the design {space.creator} will print and attach to this object.</p></div></header>
      <form className="checkout-grid" onSubmit={submit}>
        <section className="checkout-form-card" aria-labelledby="artwork-heading">
          <h2 id="artwork-heading">Your advertisement</h2>
          <label className="field-label" htmlFor="artwork">Logo, image, or design <span aria-hidden="true">*</span></label>
          <label className="upload-box" htmlFor="artwork">
            <Upload /><strong>{fileName || "Choose artwork"}</strong>
            <span>PNG, JPG, or PDF · Maximum 10 MB</span>
            <span className="button button-light">Choose File</span>
          </label>
          <input className="sr-only" id="artwork" name="artwork" type="file" required accept="image/png,image/jpeg,application/pdf" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
          <label className="field-label" htmlFor="website">Website URL <span>Optional</span></label>
          <input className="text-input" id="website" name="website" type="url" placeholder="https://yourwebsite.com" />
          <label className="field-label" htmlFor="message">Message for {space.creator} <span>Optional</span></label>
          <textarea className="text-input" id="message" name="message" rows={4} placeholder="Share printing notes or context about your design." />
          <p className="form-help">The creator sees your artwork only after payment succeeds.</p>
        </section>
        <aside className="order-card">
          <h2>Order summary</h2>
          <div className="order-object"><Image src={space.image} alt="" width={90} height={90} /><span><strong>{space.objectName}</strong>{space.placement}<small>by {space.creator}</small></span></div>
          <dl className="order-details">
            <div><dt>Physical dimensions</dt><dd>{space.width}&quot; × {space.height}&quot;</dd></div>
            <div><dt>Videos</dt><dd>{space.videos}</dd></div>
            <div><dt>Creator price</dt><dd>${space.price.toFixed(2)}</dd></div>
            <div><dt>Platform fee</dt><dd>${fee.toFixed(2)}</dd></div>
            <div className="order-total"><dt>Total</dt><dd>${(space.price + fee).toFixed(2)}</dd></div>
          </dl>
          <div className="physical-confirm"><Check /> <span><strong>Physical placement</strong>This artwork will be printed and physically attached—not digitally inserted.</span></div>
          <button className="button button-dark full-button" type="submit">Continue to Payment <LockKeyhole /></button>
          <p className="stripe-note"><LockKeyhole /> Payment is securely processed by Stripe Checkout.</p>
          <p className="status-message" role="status" aria-live="polite">{status}</p>
        </aside>
      </form>
    </div>
  );
}
