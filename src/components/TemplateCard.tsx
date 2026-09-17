"use client";

import Link from "next/link";
import ResumePreview from "./ResumePreview";
import { SAMPLE_DATA } from "@/lib/templates";
import type { TemplateInfo } from "@/lib/templates";

export default function TemplateCard({ template }: { template: TemplateInfo }) {
  const previewData = {
    ...SAMPLE_DATA,
    template: template.id,
    color: template.id === "classic" ? "#374151" : "#2563eb",
  };

  return (
    <div className="group">
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-300">
        {/* Scaled preview */}
        <div className="relative overflow-hidden rounded-lg bg-white aspect-[210/280]">
          <div
            style={{
              transform: "scale(0.38)",
              transformOrigin: "top left",
              width: "263%",
              height: "263%",
            }}
          >
            <ResumePreview data={previewData} />
          </div>
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-4 rounded-lg bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
          >
            Use this template
          </Link>
        </div>
      </div>

      <div className="mt-4 px-1">
        <h3 className="font-semibold text-lg text-white">{template.name}</h3>
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{template.description}</p>
        <div className="flex items-center gap-2 mt-2">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-md bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
          <span className="text-xs text-gray-500 ml-auto">{template.users} users</span>
        </div>
      </div>
    </div>
  );
}
