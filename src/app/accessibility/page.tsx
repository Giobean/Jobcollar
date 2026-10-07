import Link from "next/link";
import { Keyboard, Mail, MonitorSmartphone, Volume2 } from "lucide-react";
import { SiteFooter } from "@/components/creator-home";
import { SiteHeader } from "@/components/site-header";

export default function AccessibilityPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="access-page shell">
        <header><p className="kicker">Access for everyone</p><h1>Accessibility at CreatorAdSpace</h1><p>CreatorAdSpace is designed with accessibility in mind and aims to meet WCAG 2.2 AA standards.</p></header>
        <div className="access-grid">
          <article><Keyboard /><h2>Keyboard navigation</h2><p>Use <kbd>Tab</kbd> and <kbd>Shift + Tab</kbd> to move between controls. Press <kbd>Enter</kbd> or <kbd>Space</kbd> to activate them. A skip link appears first on every page.</p></article>
          <article><Volume2 /><h2>Screen readers</h2><p>Pages use semantic landmarks, descriptive image text, visible labels, and status announcements for dynamic actions.</p></article>
          <article><MonitorSmartphone /><h2>Responsive and reduced motion</h2><p>Core workflows remain available on mobile, tablet, and desktop. Your operating system&apos;s reduced-motion preference is respected.</p></article>
          <article><Mail /><h2>Report an issue</h2><p>If something prevents you from using the marketplace, email <Link href="mailto:access@creatoradspace.com">access@creatoradspace.com</Link>. Include the page and assistive technology you used, if comfortable.</p></article>
        </div>
        <p className="access-note">This statement describes our design goal and is not a claim of independent legal certification.</p>
      </main>
      <SiteFooter />
    </>
  );
}
