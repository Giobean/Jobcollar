"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TemplateCard from "@/components/TemplateCard";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

const categoryLabels: Record<string, string> = {
  all: "All",
  ats: "ATS-Friendly",
  professional: "Professional",
  modern: "Modern",
  creative: "Creative",
  simple: "Simple",
};

export default function TemplatesPage() {
  const [active, setActive] = useState("all");

  const filtered = TEMPLATES.filter((t) => {
    if (active === "all") return true;
    if (active === "ats") return t.tags.includes("ATS");
    return t.category === active;
  });

  return (
    <div className="bg-[#09090b] text-white min-h-screen">
      <Navbar />

      <section className="relative pt-32 pb-12 md:pt-44 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Professional templates
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              for every career
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Each template is designed to follow the exact rules you need to get
            hired faster. Pick one, customize it, and start landing interviews.
          </p>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="sticky top-16 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto no-scrollbar">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  active === cat
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                No templates match this filter.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-12 md:p-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to build your resume?
            </h2>
            <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
              Choose any template and create a stunning resume in minutes.
              No credit card required.
            </p>
            <Link
              href="/register"
              className="inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-600" />
            <span className="font-semibold text-sm">JobCollar</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 JobCollar. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
