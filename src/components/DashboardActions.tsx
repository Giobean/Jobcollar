"use client";

import { useState } from "react";
import UploadResumeModal from "./UploadResumeModal";
import { createResume } from "@/app/actions/resume";

export default function DashboardActions() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Upload Resume
        </button>

        <form action={createResume}>
          <input type="hidden" name="title" value="Untitled Resume" />
          <input type="hidden" name="template" value="minimal" />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New Resume
          </button>
        </form>
      </div>

      <UploadResumeModal open={showUpload} onClose={() => setShowUpload(false)} />
    </>
  );
}
