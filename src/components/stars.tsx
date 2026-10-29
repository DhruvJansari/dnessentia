import { StarIcon } from "./icons";

/** Read-only star rating; supports half stars by clipping. */
export function Stars({ value, className = "size-3.5", label = true }: { value: number; className?: string; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ? `Rated ${value} out of 5` : undefined} aria-hidden={!label}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={`relative inline-block ${className}`}>
            <StarIcon className="absolute inset-0 size-full text-sand-deep" />
            <span className="absolute inset-0 overflow-hidden text-gold" style={{ width: `${fill * 100}%` }}>
              <StarIcon className={`${className} max-w-none`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
