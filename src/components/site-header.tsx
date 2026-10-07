"use client";

import Link from "next/link";
import { Menu, PackageOpen, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="shell nav-wrap">
        <Link className="brand" href="/" aria-label="CreatorAdSpace home">
          <span className="brand-mark" aria-hidden="true">
            <PackageOpen size={20} strokeWidth={2.4} />
          </span>
          Creator<span>AdSpace</span>
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="primary-navigation"
          aria-label="Primary navigation"
          className={open ? "nav-links nav-open" : "nav-links"}
        >
          <Link href="/marketplace" onClick={() => setOpen(false)}>
            Find Ad Space
          </Link>
          <Link href="/how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            Creator dashboard
          </Link>
          <Link className="button button-dark button-small" href="/create">
            Sell Ad Space
          </Link>
        </nav>
      </div>
    </header>
  );
}
