import Link from "next/link";
import { logout } from "@/app/admin/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const settings = await getSettings();

  const items = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/properties", label: "Properties", show: can(user.role, "property.read") },
    { href: "/admin/enquiries", label: "Enquiries", show: can(user.role, "enquiry.read") },
    { href: "/admin/reports", label: "Reports", show: can(user.role, "enquiry.readAll") },
    { href: "/admin/content", label: "Content", show: can(user.role, "content.write") },
    { href: "/admin/users", label: "Users", show: can(user.role, "user.manage") },
    { href: "/admin/audit", label: "Audit log", show: can(user.role, "audit.read") },
    { href: "/admin/account", label: "My account", show: true },
  ]
    .filter((i) => i.show)
    .map(({ href, label }) => ({ href, label }));

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[248px_1fr]">
      <aside className="bg-navy-950 text-ivory-100 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block">
          <div>
            <Link href="/admin" className="font-display text-xl font-semibold text-ivory-50">
              {settings.companyName}
            </Link>
            <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-champagne-300">Administration</p>
          </div>
        </div>
        <AdminNav items={items} />
        <div className="hidden border-t border-white/10 px-5 py-5 text-sm lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:block">
          <p className="truncate font-medium text-ivory-50">{user.name}</p>
          <p className="text-xs text-ivory-100/60">{ROLE_LABELS[user.role]}</p>
          <div className="mt-3 flex gap-4 text-xs">
            <Link href="/" className="text-champagne-300 hover:text-ivory-50" target="_blank">View site ↗</Link>
            <form action={logout}>
              <button type="submit" className="text-champagne-300 hover:text-ivory-50">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-ivory-200 bg-white px-5 py-3 text-sm lg:hidden">
          <span className="truncate">{user.name} · {ROLE_LABELS[user.role]}</span>
          <form action={logout}>
            <button type="submit" className="btn-ghost btn-sm">Sign out</button>
          </form>
        </div>
        <main id="main" className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
