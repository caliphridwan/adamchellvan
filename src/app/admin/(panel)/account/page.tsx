import type { Metadata } from "next";
import { changePassword } from "@/app/admin/actions/auth";
import { EntityForm } from "@/components/admin/EntityForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My account" description={`${user.name} · ${user.email} · ${ROLE_LABELS[user.role]}`} />
      <div className="max-w-xl">
        <Card title="Change password">
          <EntityForm
            action={changePassword}
            resetOnSuccess
            submitLabel="Change password"
            sections={[{ fields: [
              { type: "password", name: "currentPassword", label: "Current password", required: true, autoComplete: "current-password" },
              { type: "password", name: "newPassword", label: "New password", required: true, autoComplete: "new-password", hint: "At least 12 characters with letters and numbers." },
              { type: "password", name: "confirmPassword", label: "Confirm new password", required: true, autoComplete: "new-password" },
            ] }]}
          />
        </Card>
      </div>
    </>
  );
}
