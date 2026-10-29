"use client";

import { useActionState, useState } from "react";
import { StarIcon } from "@/components/icons";
import { Field, FormAlert, SubmitButton, TextAreaField } from "@/components/ui/form";
import type { FormState } from "@/lib/validation";
import { submitReviewAction } from "./review-actions";

export function ReviewForm({ productId }: { productId: number }) {
  const [state, action] = useActionState(submitReviewAction, {} as FormState);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok) return <FormAlert message={state.message} />;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-dark">
        Write a review
      </button>
    );
  }
  return (
    <form action={action} className="animate-fade-up space-y-4 border border-line bg-white p-5" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <FormAlert error={state.error} />
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="transition-transform hover:scale-110"
            >
              <StarIcon className={`size-7 ${(hover || rating) >= n ? "text-gold" : "text-sand-deep"}`} />
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating && <p className="mt-1 text-[13px] text-red-700">{state.fieldErrors.rating}</p>}
      </fieldset>
      <Field label="Title (optional)" name="title" maxLength={160} />
      <TextAreaField label="Your review" name="body" rows={4} error={state.fieldErrors?.body} placeholder="How long did it last? When do you wear it?" />
      <SubmitButton className="btn btn-dark">Submit review</SubmitButton>
    </form>
  );
}
