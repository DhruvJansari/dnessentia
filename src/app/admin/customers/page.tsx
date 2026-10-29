import Link from "next/link";
import { Suspense } from "react";
import { btn, Card, Empty, fmtDate, inr, input, PageTitle, Pagination, Skeleton, Table, Tabs, Td } from "@/components/admin/ui";
import { CreateUserForm } from "@/components/admin/user-forms";
import { SearchIcon } from "@/components/icons";
import { listCustomers } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Users" };

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <PageTitle
        title="Users"
        description="Customer accounts and your team. Guest buyers appear on their orders until they register."
        actions={
          <a href="/admin/export/customers" className={btn.secondary}>
            Export CSV
          </a>
        }
      />
      <Suspense fallback={<Skeleton rows={1} />}>
        <CustomerTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CustomerTable({ searchParams }: { searchParams: PageProps<"/admin/customers">["searchParams"] }) {
  const actor = await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const role = sp.role === "customer" || sp.role === "team" ? sp.role : "all";
  const page = Math.max(1, Number(sp.page ?? 1));
  const { rows, total, pages } = await listCustomers(q, page, role);

  return (
    <>
      <details className="mb-6 rounded-2xl border border-stone-200/80 bg-white">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">+ Add a user</summary>
        <div className="border-t border-stone-100 p-5">
          <CreateUserForm canAddTeam={actor.role === "admin"} />
        </div>
      </details>
      <Tabs
        active={role}
        items={[
          { key: "all", label: "Everyone", href: "/admin/customers" },
          { key: "customer", label: "Customers", href: "/admin/customers?role=customer" },
          { key: "team", label: "Team", href: "/admin/customers?role=team" },
        ]}
      />
      <form className="mb-4 flex max-w-md gap-2" action="/admin/customers">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input name="q" defaultValue={q} placeholder="Name, email or phone" className={`${input} pl-9`} />
        </div>
        <button className={btn.secondary}>Search</button>
      </form>
      <Card padded={false}>
        {rows.length === 0 ? (
          <Empty title="No users found" />
        ) : (
          <Table head={["Customer", "Role", "Orders", "Spent", "Last order", "Joined"]}>
            {rows.map(({ user, orderCount, spent, lastOrder }) => (
              <tr key={user.id} className="relative transition-colors hover:bg-stone-50">
                <Td>
                  <Link href={`/admin/customers/${user.id}`} className="after:absolute after:inset-0">
                    <span className="block font-medium">{user.name || "-"}</span>
                    <span className="text-[12px] text-stone-500">
                      {user.email}
                      {!user.isActive && <span className="ml-2 text-red-700">disabled</span>}
                      {!user.emailVerifiedAt && <span className="ml-2 text-amber-700">unverified</span>}
                    </span>
                  </Link>
                </Td>
                <Td className="capitalize text-stone-600">{user.role}</Td>
                <Td className="tabular-nums">{orderCount ?? 0}</Td>
                <Td className="tabular-nums">{inr(Number(spent ?? 0))}</Td>
                <Td className="text-stone-500">{lastOrder ? fmtDate(new Date(lastOrder)) : "-"}</Td>
                <Td className="text-stone-500">{fmtDate(user.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pages} makeHref={(p) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
      </Card>
      <p className="mt-3 text-[12px] text-stone-500">{total} account{total === 1 ? "" : "s"}</p>
    </>
  );
}
