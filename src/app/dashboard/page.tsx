import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeDollarSign, Bell, CircleDollarSign, Copy, LayoutGrid,
  PackageOpen, Plus, Send, Settings, Store, UserRound, WalletCards,
} from "lucide-react";
import { adSpaces } from "@/lib/data";
import type { CreatorApprovalStatus } from "@/lib/data";
import { ApprovalStatusCard } from "@/components/approval-status-card";
import { isSupabaseConfigured } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const nav = [
  [LayoutGrid, "Home"], [Store, "My Ad Spaces"], [Send, "Requests"],
  [WalletCards, "Earnings"], [UserRound, "Profile"],
] as const;

export const dynamic = "force-dynamic";

async function getApprovalState() {
  const fallback = {
    status: "approved" as CreatorApprovalStatus,
    submitted: true,
    reason: null as string | null,
    missingFields: [] as string[],
  };
  if (!isSupabaseConfigured()) return fallback;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fallback;
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "name,username,avatar_url,bio,content_category,primary_platform,average_views,followers,approval_status,approval_submitted_at,approval_reason",
    )
    .eq("user_id", user.id)
    .eq("type", "creator")
    .maybeSingle();
  if (!profile) return fallback;
  const required = [
    ["Name", profile.name],
    ["Username", profile.username],
    ["Profile photo", profile.avatar_url],
    ["Bio", profile.bio],
    ["Content category", profile.content_category],
    ["Primary social platform", profile.primary_platform],
    ["Average views", Number(profile.average_views) > 0],
    ["Followers", Number(profile.followers) > 0],
  ] as const;
  return {
    status: profile.approval_status as CreatorApprovalStatus,
    submitted: Boolean(profile.approval_submitted_at),
    reason: profile.approval_reason,
    missingFields: required.filter(([, value]) => !value).map(([label]) => label),
  };
}

export default async function DashboardPage() {
  const spaces = adSpaces.filter((space) => space.username === "alex");
  const approval = await getApprovalState();
  return (
    <main id="main-content" className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="brand" href="/"><span className="brand-mark"><PackageOpen /></span>Creator<span>AdSpace</span></Link>
        <nav aria-label="Creator dashboard">{nav.map(([Icon, label], index) => <Link className={index === 0 ? "active" : ""} key={label} href="#"><Icon />{label}{label === "Requests" && <b>2</b>}</Link>)}</nav>
        <div className="sidebar-bottom"><Link href="/accessibility"><Settings /> Help & access</Link><div className="sidebar-user"><span className="avatar avatar-large">AR</span><span><strong>Alex Rivera</strong>Creator account</span></div></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar"><div><p>Wednesday, October 7</p><h1>Good evening, Alex.</h1></div><div><button className="notification-button" aria-label="Notifications"><Bell /><span>2</span></button><Link className="button button-dark" href="/create"><Plus /> Create Ad Space</Link></div></header>
        <ApprovalStatusCard
          status={approval.status}
          submitted={approval.submitted}
          reason={approval.reason}
          missingFields={approval.missingFields}
        />
        <div className="profile-link-card"><div><span className="live-dot">● Live profile</span><strong>creatoradspace.com/alex</strong><p>Share this link in your social bio so viewers can buy your available spaces.</p></div><button className="button button-light" type="button"><Copy /> Copy profile link</button></div>
        <section aria-labelledby="metrics-title"><h2 className="sr-only" id="metrics-title">Dashboard metrics</h2><div className="metric-grid">
          {[["Available spaces", "4", Store, "+1 this month"], ["Pending requests", "2", Send, "Needs attention"], ["Potential earnings", "$950", BadgeDollarSign, "From open inventory"], ["Available to payout", "$300", CircleDollarSign, "Payouts enabled"]].map(([label, value, Icon, note]) => {
            const MetricIcon = Icon as typeof Store;
            return <article className="metric-card" key={label as string}><span><MetricIcon /></span><p>{label as string}</p><strong>{value as string}</strong><small>{note as string}</small></article>;
          })}
        </div></section>
        <div className="dashboard-columns">
          <section className="inventory-section" aria-labelledby="inventory-heading"><div className="dashboard-section-heading"><div><p className="kicker">Physical portfolio</p><h2 id="inventory-heading">Your Ad Inventory</h2></div><Link href="#">View all <ArrowRight /></Link></div>
            <div className="inventory-list">{spaces.map((space) => <article key={space.id}><div className="inventory-thumb"><Image src={space.image} alt={space.imageAlt} fill sizes="100px" /></div><div><span className="status-badge">{approval.status === "approved" ? "✓ Available" : "◷ Pending approval — not visible to advertisers"}</span><h3>{space.objectName}</h3><p>{space.placement} · {space.width}&quot; × {space.height}&quot;</p></div><div className="inventory-price"><strong>${space.price}</strong><span>{space.videos} videos</span></div></article>)}
              <article className="inventory-empty"><Link href="/create"><Plus /><span><strong>Add another surface</strong>One object can hold several independent Ad Spaces.</span></Link></article>
            </div>
          </section>
          <aside className="request-panel"><div className="dashboard-section-heading"><div><p className="kicker">New business</p><h2>Requests</h2></div><span className="count-badge">2</span></div>
            <article className="request-card"><div className="request-art">VB</div><div><span className="status-badge status-paid">✓ Paid</span><h3>Venture Boards</h3><p>Skateboard Deck · 10 videos</p></div><strong>$500</strong><Link className="button button-light" href="#">Review request</Link></article>
            <article className="request-card"><div className="request-art request-blue">FL</div><div><span className="status-badge status-paid">✓ Paid</span><h3>Flow Labs</h3><p>Black Skate Cap · 5 videos</p></div><strong>$150</strong><Link className="button button-light" href="#">Review request</Link></article>
          </aside>
        </div>
      </section>
    </main>
  );
}
