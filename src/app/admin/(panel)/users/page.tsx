import type { Metadata } from "next";
import { createUser, updateUser } from "@/app/admin/actions/users";
import { EntityForm } from "@/components/admin/EntityForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS, type RoleValue } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

const roleOptions = (Object.keys(ROLE_LABELS) as RoleValue[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export default async function UsersPage() {
  const me = await requireUser("user.manage");
  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, _count: { select: { assignedEnquiries: true } } },
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Administrators manage everything. Editors manage listings, content and enquiries. Agents see enquiries assigned to them."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {users.map((u) => (
            <details key={u.id} className="rounded-md border border-ivory-200 bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className={u.isActive ? "font-medium text-navy-900" : "font-medium text-charcoal-400 line-through"}>{u.name}</span>
                  {u.id === me.id ? <span className="ml-2 text-xs text-champagne-700">(you)</span> : null}
                  <span className="block text-xs text-charcoal-500">{u.email}</span>
                </span>
                <span className="text-right text-xs text-charcoal-500">
                  {ROLE_LABELS[u.role]} · {u._count.assignedEnquiries} assigned
                  <span className="block">Last sign-in: {u.lastLoginAt ? formatDate(u.lastLoginAt) : "never"}</span>
                </span>
              </summary>
              <div className="border-t border-ivory-200 p-5">
                <EntityForm
                  action={updateUser}
                  idPrefix={`u-${u.id}`}
                  submitLabel="Update user"
                  values={{ id: u.id, name: u.name, role: u.role, isActive: u.isActive }}
                  sections={[{ fields: [
                    { type: "hidden", name: "id" },
                    { type: "text", name: "name", label: "Name", required: true, span: 1 },
                    { type: "select", name: "role", label: "Role", options: roleOptions, span: 1 },
                    { type: "checkbox", name: "isActive", label: "Account active", span: 1 },
                    { type: "password", name: "newPassword", label: "Reset password", span: 1, autoComplete: "new-password", hint: "Leave blank to keep the current password. Signs the user out everywhere." },
                  ] }]}
                />
              </div>
            </details>
          ))}
        </div>
        <Card title="Add a user">
          <EntityForm
            action={createUser}
            idPrefix="new-user"
            resetOnSuccess
            submitLabel="Create user"
            values={{ role: "AGENT" }}
            sections={[{ fields: [
              { type: "text", name: "name", label: "Full name", required: true },
              { type: "email", name: "email", label: "Email", required: true },
              { type: "select", name: "role", label: "Role", options: roleOptions },
              { type: "password", name: "password", label: "Temporary password", required: true, autoComplete: "new-password", hint: "At least 12 characters with letters and numbers." },
            ] }]}
          />
        </Card>
      </div>
    </>
  );
}
