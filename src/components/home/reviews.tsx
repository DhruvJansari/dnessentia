import { reviews } from "@/data/site";
import { GoogleIcon, StarIcon, VerifiedIcon } from "../icons";
import { ReviewText } from "./review-text";

function FlowerMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 animate-[spin_18s_linear_infinite] text-ink-soft" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      {[0, 45, 90, 135].map((deg) => (
        <ellipse key={deg} cx="12" cy="12" rx="3.2" ry="9" transform={`rotate(${deg} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="1.6" />
    </svg>
  );
}

export function Reviews() {
  return (
    <section className="section-y">
      <div className="container-x">
        <div className="reveal text-center">
          <h2 className="text-[2.5rem] sm:text-5xl lg:text-[3.75rem]">Loved by Many</h2>
          <div className="mt-5 flex items-center justify-center gap-4" aria-hidden>
            <span className="h-px w-24 bg-ink/40 sm:w-36" />
            <FlowerMark />
            <span className="h-px w-24 bg-ink/40 sm:w-36" />
          </div>
        </div>

        <div className="reveal-stagger mx-auto mt-10 grid max-w-5xl gap-4 sm:gap-6 md:mt-14 md:grid-cols-2">
          {reviews.map((review) => (
            <figure key={review.name} className="flex flex-col rounded-xl bg-cream p-5 ring-1 ring-line transition-[box-shadow,--tw-ring-color] duration-500 hover:shadow-[0_22px_44px_-26px_rgba(28,23,18,0.4)] hover:ring-gold/40 sm:p-7">
              <figcaption className="flex items-start gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full text-lg font-medium text-white"
                  style={{ backgroundColor: review.avatarColor }}
                  aria-hidden
                >
                  {review.name[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium leading-tight">{review.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{review.date}</p>
                </div>
                <GoogleIcon className="size-5 shrink-0" />
                <span className="sr-only">Review from {review.source}</span>
              </figcaption>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="flex gap-0.5 text-[#fbbc04]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon key={i} className={`size-[18px] ${i < review.rating ? "" : "opacity-25"}`} />
                  ))}
                </span>
                <VerifiedIcon className="size-4 text-[#1a73e8]" />
                <span className="sr-only">Verified review</span>
              </div>

              <ReviewText paragraphs={review.text} />
            </figure>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-[13px] text-muted">
          <GoogleIcon className="size-4" />
          <span>
            Verified reviews from <span className="font-medium text-ink">Google</span> · Rated 5.0
          </span>
        </p>
      </div>
    </section>
  );
}
