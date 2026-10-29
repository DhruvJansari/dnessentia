"use client";

import { useState, useTransition } from "react";
import { deleteReviewAction, moderateReviewAction, replyReviewAction } from "@/app/admin/reviews/actions";
import { Spinner } from "../ui/form";
import { btn, input } from "./ui";

export function ReviewControls({ id, status, reply }: { id: number; status: string; reply: string | null }) {
  const [pending, start] = useTransition();
  const [text, setText] = useState(reply ?? "");
  const [replying, setReplying] = useState(false);
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <button type="button" disabled={pending} onClick={() => start(() => moderateReviewAction(id, "approved"))} className={btn.primary}>
            {pending && <Spinner />} Publish
          </button>
        )}
        {status !== "rejected" && (
          <button type="button" disabled={pending} onClick={() => start(() => moderateReviewAction(id, "rejected"))} className={btn.secondary}>
            Hide
          </button>
        )}
        <button type="button" onClick={() => setReplying((v) => !v)} className={btn.secondary}>
          {reply ? "Edit reply" : "Reply"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => confirm("Delete this review permanently?") && start(() => deleteReviewAction(id))}
          className={btn.danger}
        >
          Delete
        </button>
      </div>
      {replying && (
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Public reply from DN Essentia" className={input} />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await replyReviewAction(id, text);
                setReplying(false);
              })
            }
            className={btn.primary}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
