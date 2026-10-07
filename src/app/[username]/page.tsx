import Link from "next/link";
import { Copy, Instagram, MapPin, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { AdSpaceCard } from "@/components/ad-space-card";
import { SiteFooter } from "@/components/creator-home";
import { SiteHeader } from "@/components/site-header";
import { ProfileActions } from "@/components/profile-actions";
import { adSpaces, formatViews } from "@/lib/data";

export function generateStaticParams() {
  return ["alex", "maya", "jordan", "sam"].map((username) => ({ username }));
}

export default async function ProfilePage({ params }: PageProps<"/[username]">) {
  const { username } = await params;
  const listings = adSpaces.filter((space) => space.username === username);
  if (!listings.length) notFound();
  const creator = listings[0];
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="profile-hero">
          <div className="shell profile-header">
            <div className="profile-avatar">{creator.creator.split(" ").map((part) => part[0]).join("")}</div>
            <div><p className="verified"><Sparkles /> Creator profile</p><h1>{creator.creator}</h1><p>{creator.category} creator · Everyday sessions, gear, and life on four wheels.</p><span className="profile-meta"><MapPin /> Los Angeles, CA <b>·</b> <Instagram /> {formatViews(creator.averageViews)} average views*</span></div>
            <ProfileActions />
          </div>
        </section>
        <section className="shell profile-inventory" aria-labelledby="available-heading">
          <div className="section-heading"><div><p className="kicker">Physical inventory</p><h2 id="available-heading">Available Ad Spaces</h2><p>Choose a surface and send your artwork. Every placement is physically printed and attached.</p></div><span className="listing-count">{listings.length} available</span></div>
          <div className="card-grid">{listings.map((space) => <AdSpaceCard key={space.id} space={space} />)}</div>
          <p className="provided-note">* Audience metrics are creator-provided information.</p>
        </section>
        <section className="profile-clarity"><div className="shell"><div><Copy /><span><strong>One link. Every surface.</strong>Creators can place this profile link in any social bio.</span></div><Link className="button button-primary" href="/create">Sell your own Ad Space</Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
