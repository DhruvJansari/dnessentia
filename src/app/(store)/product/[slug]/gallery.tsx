"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({
  images,
  alt,
  ratio = "aspect-[4/5]",
}: {
  images: string[];
  alt: string;
  ratio?: string;
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col-reverse gap-3 sm:gap-4 lg:sticky lg:top-28 lg:flex-row lg:self-start">
      {images.length > 1 && (
        <div className="flex gap-3 lg:flex-col" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/5] w-16 overflow-hidden border bg-white transition-colors sm:w-20 ${
                active === i ? "border-ink" : "border-line hover:border-ink/40"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className={`relative ${ratio} flex-1 overflow-hidden bg-white`}>
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? alt : `${alt}, view ${i + 1}`}
            fill
            preload={i === 0}
            quality={90}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className={`object-contain transition-opacity duration-500 ${active === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
