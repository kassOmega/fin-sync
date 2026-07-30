import { SystemRole } from "./types";

// Staff-eligible roles (excludes Owner - only one Owner per deployment)
export const STAFF_ROLES = Object.entries(SystemRole)
  .filter(([key]) => key !== "Owner")
  .map(([key, value]) => ({
    value,
    label: key.replace(/([a-z])([A-Z])/g, "$1 $2"), // OperatorDriver → Operator Driver
  }));

// All roles for display purposes
export const ALL_ROLES = Object.entries(SystemRole).map(([key, value]) => ({
  value,
  label: key.replace(/([a-z])([A-Z])/g, "$1 $2"),
}));

export function getRoleLabel(role: string): string {
  return role.replace(/([a-z])([A-Z])/g, "$1 $2");
}
