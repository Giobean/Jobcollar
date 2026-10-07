import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Eye, Info, Play, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/creator-home";
import { SiteHeader } from "@/components/site-header";
import { adSpaces, formatViews, getAdSpace } from "@/lib/data";

export function generateStaticParams() {
  return adSpaces.map(({ id }) => ({ id }));
}

export default async function AdSpaceDetail({ params }: PageProps<"/spaces/[id]">) {
  const { id } = await params;
  if (!adSpaces.some((space) => space.id === id)) notFound();
  const space = getAdSpace(id);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="detail-page shell">
        <Link className="back-link" href="/marketplace"><ArrowLeft /> Back to marketplace</Link>
        <div className="detail-grid">
          <div>
            <div className="detail-image">
              <Image src={space.image} alt={space.imageAlt} fill priority sizes="(max-width: 850px) 100vw, 58vw" />
              <div className="detail-overlay" style={{ "--accent": space.accent } as React.CSSProperties}>
                <span>Available ad space</span>
                <strong>{space.width}&quot; × {space.height}&quot;</strong>
              </div>
            </div>
            <p className="image-note"><Info /> Placement outline is approximate and does not represent exact physical scale.</p>
            <section className="detail-description">
              <h2>About this Ad Space</h2>
              <p>{space.description}</p>
              <div className="physical-note"><strong>This is a physical advertisement.</strong><span>Your design will be printed and attached to the creator&apos;s {space.objectName.toLowerCase()}—not digitally added to a video.</span></div>
            </section>
          </div>
          <aside className="purchase-card">
            <div className="creator-profile-line">
              <span className="avatar avatar-large">{space.creator.split(" ").map((part) => part[0]).join("")}</span>
              <span><strong>{space.creator}</strong><Link href={`/${space.username}`}>View creator profile</Link></span>
            </div>
            <p className="eyebrow">{space.objectType} · {space.placement}</p>
            <h1>{space.objectName}</h1>
            <div className="detail-stats">
              <span><strong>{space.width}&quot; × {space.height}&quot;</strong>Physical size</span>
              <span><strong>{space.videos}</strong>Videos included</span>
              <span><strong>{formatViews(space.averageViews)}</strong>Average views*</span>
            </div>
            <p className="provided-note">* Creator-provided information</p>
            <div className="price-summary">
              <span>Creator price <strong>${space.price}</strong></span>
              <span>CreatorAdSpace recommends <strong>${space.recommendedPrice}</strong></span>
              <p>The creator decides what this Ad Space is worth.</p>
            </div>
            <Link className="button button-primary full-button" href={`/checkout/${space.id}`}>Buy Ad Space</Link>
            <div className="safe-list"><span><ShieldCheck /> Secure payment with Stripe</span><span><Check /> Artwork reviewed before fulfillment</span><span><Play /> Proof submitted for every video</span></div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
