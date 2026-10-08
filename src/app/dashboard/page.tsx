import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeDollarSign, Bell, CircleDollarSign, Copy, LayoutGrid,
  PackageOpen, Plus, Send, Settings, Store, UserRound, WalletCards,
} from "lucide-react";
import { adSpaces } from "@/lib/data";

const nav = [
  [LayoutGrid, "Home"], [Store, "My Ad Spaces"], [Send, "Requests"],
  [WalletCards, "Earnings"], [UserRound, "Profile"],
] as const;

export default function DashboardPage() {
  const spaces = adSpaces.filter((space) => space.username === "alex");
  return (
    <main id="main-content" className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="brand" href="/"><span className="brand-mark"><PackageOpen /></span>Creator<span>AdSpace</span></Link>
        <nav aria-label="Creator dashboard">{nav.map(([Icon, label], index) => <Link className={index === 0 ? "active" : ""} key={label} href="#"><Icon />{label}{label === "Requests" && <b>2</b>}</Link>)}</nav>
        <div className="sidebar-bottom"><Link href="/accessibility"><Settings /> Help & access</Link><div className="sidebar-user"><span className="avatar avatar-large">AR</span><span><strong>Alex Rivera</strong>Creator account</span></div></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar"><div><p>Wednesday, October 7</p><h1>Good evening, Alex.</h1></div><div><button className="notification-button" aria-label="Notifications"><Bell /><span>2</span></button><Link className="button button-dark" href="/create"><Plus /> Create Ad Space</Link></div></header>
        <div className="profile-link-card"><div><span className="live-dot">● Live profile</span><strong>creatoradspace.com/alex</strong><p>Share this link in your social bio so viewers can buy your available spaces.</p></div><button className="button button-light" type="button"><Copy /> Copy profile link</button></div>
        <section aria-labelledby="metrics-title"><h2 className="sr-only" id="metrics-title">Dashboard metrics</h2><div className="metric-grid">
          {[["Available spaces", "4", Store, "+1 this month"], ["Pending requests", "2", Send, "Needs attention"], ["Potential earnings", "$950", BadgeDollarSign, "From open inventory"], ["Available to payout", "$300", CircleDollarSign, "Payouts enabled"]].map(([label, value, Icon, note]) => {
            const MetricIcon = Icon as typeof Store;
            return <article className="metric-card" key={label as string}><span><MetricIcon /></span><p>{label as string}</p><strong>{value as string}</strong><small>{note as string}</small></article>;
          })}
        </div></section>
        <div className="dashboard-columns">
          <section className="inventory-section" aria-labelledby="inventory-heading"><div className="dashboard-section-heading"><div><p className="kicker">Physical portfolio</p><h2 id="inventory-heading">Your Ad Inventory</h2></div><Link href="#">View all <ArrowRight /></Link></div>
            <div className="inventory-list">{spaces.map((space) => <article key={space.id}><div className="inventory-thumb"><Image src={space.image} alt={space.imageAlt} fill sizes="100px" /></div><div><span className="status-badge">✓ Available</span><h3>{space.objectName}</h3><p>{space.placement} · {space.width}&quot; × {space.height}&quot;</p></div><div className="inventory-price"><strong>${space.price}</strong><span>{space.videos} videos</span></div></article>)}
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
