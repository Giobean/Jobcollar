"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090b]/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-blue-600" />
              <span className="text-lg font-bold text-white">JobCollar</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Features
              </a>
              <Link
                href="/templates"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Templates
              </Link>
              <a
                href="#pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              Get Started Free
            </Link>
          </div>
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[#09090b]/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-3">
          <a
            href="#features"
            className="block text-sm text-gray-400 hover:text-white py-2"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </a>
          <Link
            href="/templates"
            className="block text-sm text-gray-400 hover:text-white py-2"
            onClick={() => setMobileOpen(false)}
          >
            Templates
          </Link>
          <a
            href="#pricing"
            className="block text-sm text-gray-400 hover:text-white py-2"
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </a>
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white py-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white text-center hover:bg-blue-500 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
