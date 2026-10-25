import { AccountNav } from "./account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="container-x pb-20 pt-10 md:pb-28 md:pt-14">
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
