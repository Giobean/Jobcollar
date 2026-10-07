import Link from "next/link";
import { ArrowRight, Check, CircleDollarSign, ImageUp, PackageCheck, Printer, Video } from "lucide-react";
import { SiteFooter } from "@/components/creator-home";
import { SiteHeader } from "@/components/site-header";

export default function HowItWorksPage() {
  const flow = [
    [ImageUp, "List a physical surface", "The creator photographs an object, defines the exact placement, and sets the print dimensions."],
    [CircleDollarSign, "An advertiser buys it", "The buyer uploads finished artwork and pays securely through Stripe Checkout."],
    [Printer, "Print and attach", "The creator prints the artwork at the agreed dimensions and physically attaches it."],
    [Video, "Make normal videos", "The creator keeps making their usual content while the physical advertisement stays visible."],
    [PackageCheck, "Prove and complete", "Proof is uploaded for each video. Once the count is reached, earnings become payable."],
  ] as const;
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <header className="info-hero shell"><p className="kicker">Object → ad → videos → payout</p><h1>Advertising you can<br />actually touch.</h1><p>CreatorAdSpace connects creator-owned physical real estate with people who want to be seen.</p></header>
        <section className="shell process-list" aria-label="How CreatorAdSpace works">{flow.map(([Icon, title, text], index) => <article key={title}><span>{index + 1}</span><Icon /><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
        <section className="shell creator-sign"><div><p className="kicker">Built-in growth loop</p><h2>Your availability can be visible, too.</h2><p>Every published listing gets a printable sign for the object or filming space.</p><ul><li><Check /> Small, medium, or large</li><li><Check /> Clear price and video count</li><li><Check /> Your public profile URL</li></ul></div><div className="print-card"><b>BUY AD SPACE</b><strong>$150</strong><span>5 VIDEOS</span><small>creatoradspace.com/alex</small></div></section>
        <section className="shell cta-section"><div className="cta-panel"><div><p className="kicker">Start with one surface</p><h2>What could your audience already see?</h2></div><Link className="button button-dark" href="/create">Create an Ad Space <ArrowRight /></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
