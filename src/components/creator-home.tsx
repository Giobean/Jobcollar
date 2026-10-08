import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeDollarSign, Check, ImageIcon, PackageCheck,
  Play, Printer, Ruler, Sparkles,
} from "lucide-react";
import { AdSpaceCard } from "@/components/ad-space-card";
import { SiteHeader } from "@/components/site-header";
import { publicAdSpaces } from "@/lib/data";

export function CreatorHome() {
  const steps = [
    [ImageIcon, "Choose your object", "Pick something you already use or wear in your content."],
    [Ruler, "Define the space", "Select the exact physical surface and enter its dimensions."],
    [BadgeDollarSign, "Set your price", "See our recommendation, then decide what you charge."],
    [PackageCheck, "Get a buyer", "An advertiser uploads artwork and purchases your space."],
    [Printer, "Put the ad on", "Print the design at the required size and physically attach it."],
    [Play, "Keep creating", "Make your normal videos and upload proof as you go."],
  ] as const;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <div className="pill"><Sparkles size={15} /> The physical ad marketplace for creators</div>
              <h1>Your videos have more <em>ad space</em> than you think.</h1>
              <p>Sell advertising space on the physical objects your audience already sees. You choose the surface, size, videos, and price.</p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/create">Sell Ad Space <ArrowRight size={18} /></Link>
                <Link className="button button-light" href="/marketplace">Find Ad Space</Link>
              </div>
              <div className="trust-row">
                <span><Check /> You set the price</span>
                <span><Check /> No video editing</span>
                <span><Check /> Stripe-secured payments</span>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo">
                <Image
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=90"
                  alt="White creator t-shirt showing three example physical advertising areas"
                  fill sizes="(max-width: 900px) 100vw, 46vw" priority
                />
                <div className="hero-label hero-label-chest"><span>Left chest</span><strong>3&quot; × 3&quot;</strong><b>$150</b></div>
                <div className="hero-label hero-label-sleeve"><span>Sleeve</span><strong>2&quot; × 5&quot;</strong><b>$100</b></div>
                <div className="hero-label hero-label-back"><span>Back</span><strong>8&quot; × 4&quot;</strong><b>$300</b></div>
              </div>
              <div className="floating-card">
                <span className="floating-icon"><BadgeDollarSign /></span>
                <span>Creator earnings<strong>$1,240 this month</strong></span>
                <span className="trend">+18%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="shell featured-section" aria-labelledby="featured-title">
          <div className="section-heading">
            <div><p className="kicker">Available now</p><h2 id="featured-title">Physical space, real attention.</h2></div>
            <Link className="text-link" href="/marketplace">Browse all spaces <ArrowRight /></Link>
          </div>
          <div className="card-grid">{publicAdSpaces.slice(0, 3).map((space) => <AdSpaceCard key={space.id} space={space} />)}</div>
        </section>

        <section className="how-section" aria-labelledby="how-title">
          <div className="shell">
            <div className="center-heading"><p className="kicker">How it works</p><h2 id="how-title">From object to income.</h2><p>List what you already own. Keep making the content your audience already loves.</p></div>
            <ol className="steps-grid">
              {steps.map(([Icon, title, text], index) => (
                <li key={title}>
                  <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                  <Icon /><h3>{title}</h3><p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="clarity-section">
          <div className="shell clarity-grid">
            <div><p className="kicker kicker-light">Keep it real</p><h2>Physical ads.<br />Not digital tricks.</h2></div>
            <div className="clarity-copy">
              <p className="clarity-lead">CreatorAdSpace does not digitally insert advertisements into creator videos.</p>
              <p>The creator physically prints the advertiser&apos;s design, attaches it to their object, and keeps making normal content. The ad is there because the object is there.</p>
              <Link className="button button-white" href="/how-it-works">See how fulfillment works <ArrowRight /></Link>
            </div>
          </div>
        </section>

        <section className="shell cta-section">
          <div className="cta-panel">
            <div><p className="kicker">Your objects are inventory</p><h2>Turn what you own into what you earn.</h2><p>Create your first physical Ad Space in a few minutes.</p></div>
            <Link className="button button-dark" href="/create">Create Your First Ad Space <ArrowRight /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div><Link className="brand brand-footer" href="/">Creator<span>AdSpace</span></Link><p>Physical advertising space, owned by creators.</p></div>
        <nav aria-label="Footer navigation"><Link href="/marketplace">Marketplace</Link><Link href="/create">For creators</Link><Link href="/accessibility">Accessibility</Link><Link href="/dashboard">Dashboard</Link></nav>
        <p>© 2026 CreatorAdSpace</p>
      </div>
    </footer>
  );
}
