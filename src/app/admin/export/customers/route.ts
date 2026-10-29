import { csvResponse, toCsv } from "@/lib/admin/csv";
import { listCustomers } from "@/lib/admin/queries";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";

const ist = (d: Date | null) => (d ? new Date(new Date(d).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) : "");

/** Every registered account with order count and lifetime spend. */
export async function GET() {
  const actor = await requireStaff();
  const all: Awaited<ReturnType<typeof listCustomers>>["rows"] = [];
  for (let page = 1; ; page++) {
    const { rows, pages } = await listCustomers(undefined, page);
    all.push(...rows);
    if (page >= pages) break;
  }
  const body = toCsv(
    ["Name", "Email", "Phone", "Role", "Email verified", "Active", "Orders", "Lifetime spend", "Last order", "Joined"],
    all.map(({ user, orderCount, spent, lastOrder }) => [
      user.name, user.email, user.phone, user.role, user.emailVerifiedAt ? "yes" : "no", user.isActive ? "yes" : "no",
      orderCount ?? 0, Number(spent ?? 0), ist(lastOrder), ist(user.createdAt),
    ]),
  );
  await audit({ actor, action: "export.customers", entityType: "export", summary: `Exported ${all.length} users` });
  return csvResponse("dn-users.csv", body);
}
