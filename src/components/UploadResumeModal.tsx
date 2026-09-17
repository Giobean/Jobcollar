"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function UploadResumeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const accept = ".pdf,.docx,.txt";
  const maxSize = 5 * 1024 * 1024;

  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      if (file.size > maxSize) {
        setError("File exceeds 5 MB limit.");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext || "")) {
        setError("Please upload a PDF, DOCX, or TXT file.");
        return;
      }

      setUploading(true);
      setProgress(20);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setProgress(50);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        setProgress(80);

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Upload failed");
        }

        const { id } = await res.json();
        setProgress(100);

        setTimeout(() => {
          onClose();
          router.push(`/resumes/${id}`);
        }, 400);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setUploading(false);
        setProgress(0);
      }
    },
    [onClose, router, maxSize],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#111113] border border-white/10 rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Upload Resume</h2>
        <p className="text-gray-400 text-sm mb-6">
          Import an existing resume to continue editing in JobCollar.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? "border-blue-500 bg-blue-600/10"
              : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-300 mb-3">Processing your resume...</p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Drop your resume here</p>
              <p className="text-sm text-gray-500">
                or click to browse · PDF, DOCX, TXT up to 5 MB
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
