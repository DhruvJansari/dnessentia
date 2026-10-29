import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { btn, Card, Empty, fmtDateTime, PageTitle, Skeleton, Tabs } from "@/components/admin/ui";
import { contactMessages, db } from "@/db";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Messages" };

async function setStatus(formData: FormData) {
  "use server";
  const actor = await requireStaff();
  const id = Number(formData.get("id"));
  const status = formData.get("status") === "closed" ? "closed" : formData.get("status") === "replied" ? "replied" : "new";
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  await audit({ actor, action: "message.status", entityType: "message", entityId: id, summary: `Marked contact message as ${status}` });
  revalidatePath("/admin/messages");
}

export default function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <>
      <PageTitle title="Messages" description="Everything sent through the Contact page. Reply by email, then mark it as replied." />
      <Suspense fallback={<Skeleton rows={2} />}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Inbox({ searchParams }: { searchParams: PageProps<"/admin/messages">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const status = sp.status === "replied" || sp.status === "closed" ? sp.status : "new";
  const rows = await db.select().from(contactMessages).where(eq(contactMessages.status, status)).orderBy(desc(contactMessages.createdAt)).limit(100);
  return (
    <>
      <Tabs
        active={status}
        items={[
          { key: "new", label: "New", href: "/admin/messages" },
          { key: "replied", label: "Replied", href: "/admin/messages?status=replied" },
          { key: "closed", label: "Closed", href: "/admin/messages?status=closed" },
        ]}
      />
      {rows.length === 0 ? (
        <Card>
          <Empty title="Inbox zero" text="New messages from the Contact page appear here." />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.subject}</p>
                  <p className="text-sm text-stone-500">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="underline underline-offset-4">
                      {m.email}
                    </a>
                    {m.phone ? ` · ${m.phone}` : ""}
                    {m.orderNumber ? ` · Order ${m.orderNumber}` : ""}
                  </p>
                </div>
                <span className="text-[12px] text-stone-500">{fmtDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-stone-700">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["replied", "closed", "new"] as const)
                  .filter((s) => s !== m.status)
                  .map((s) => (
                    <form key={s} action={setStatus}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className={s === "replied" ? btn.primary : btn.secondary}>{s === "replied" ? "Mark replied" : s === "closed" ? "Close" : "Reopen"}</button>
                    </form>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
