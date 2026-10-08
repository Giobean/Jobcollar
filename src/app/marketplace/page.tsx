import type { Metadata } from "next";
import { MarketplaceGrid } from "@/components/marketplace-grid";
import { SiteFooter } from "@/components/creator-home";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Find Physical Ad Space" };

export default function MarketplacePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="marketplace-page">
        <header className="marketplace-hero shell">
          <p className="kicker">Creator inventory</p>
          <h1>Find Physical Ad Space</h1>
          <p>Put your artwork on real objects, in real creator content.</p>
        </header>
        <MarketplaceGrid />
      </main>
      <SiteFooter />
    </>
  );
}
