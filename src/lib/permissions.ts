// Role → permission matrix. Pure so it can be unit-tested; enforced server-side in lib/auth.ts.

export type RoleValue = "ADMIN" | "EDITOR" | "AGENT";

export const PERMISSIONS = {
  "dashboard.view": ["ADMIN", "EDITOR", "AGENT"],
  "property.read": ["ADMIN", "EDITOR", "AGENT"],
  "property.write": ["ADMIN", "EDITOR"],
  "property.publish": ["ADMIN", "EDITOR"],
  "property.delete": ["ADMIN"],
  "content.write": ["ADMIN", "EDITOR"],
  "settings.write": ["ADMIN"],
  "enquiry.read": ["ADMIN", "EDITOR", "AGENT"],
  "enquiry.readAll": ["ADMIN", "EDITOR"],
  "enquiry.write": ["ADMIN", "EDITOR", "AGENT"],
  "enquiry.assign": ["ADMIN", "EDITOR"],
  "enquiry.export": ["ADMIN", "EDITOR"],
  "enquiry.delete": ["ADMIN"],
  "user.manage": ["ADMIN"],
  "audit.read": ["ADMIN"],
} as const satisfies Record<string, readonly RoleValue[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: RoleValue | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly RoleValue[]).includes(role);
}

export const ROLE_LABELS: Record<RoleValue, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
  AGENT: "Agent",
};
