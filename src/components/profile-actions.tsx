"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function ProfileActions() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button className="button button-light" type="button" onClick={copy}>
      {copied ? <Check /> : <Copy />} {copied ? "Link copied" : "Copy profile link"}
    </button>
  );
}
