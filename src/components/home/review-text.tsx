"use client";

import { useState } from "react";

/** Clamps long reviews to three lines with a "Read more" toggle, like the Google widget. */
export function ReviewText({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = paragraphs.join(" ").length > 160;
  return (
    <div className="mt-3">
      <blockquote
        className={`whitespace-pre-line text-[15px] leading-relaxed text-ink-soft ${expanded || !isLong ? "" : "line-clamp-3"}`}
      >
        {paragraphs.join("\n")}
      </blockquote>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {expanded ? "Hide" : "Read more"}
        </button>
      )}
    </div>
  );
}
