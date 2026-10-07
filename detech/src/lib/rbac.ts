import type { Role } from "@/lib/enums";

/**
 * Role-Based Access Control.
 *
 * A single source of truth used by:
 *  - `src/middleware.ts`      (edge route guard)
 *  - the dashboard sidebar    (what a role can see)
 *  - API route handlers       (`requireRole(...)`)
 */

export type ModuleKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "classes"
  | "subjects"
  | "attendance"
  | "timetable"
  | "exams"
  | "fees"
  | "library"
  | "transport"
  | "assignments"
  | "messages"
  | "announcements"
  | "reports"
  | "notifications"
  | "settings";

/** Which roles may open each module. */
export const MODULE_ACCESS: Record<ModuleKey, Role[]> = {
  dashboard: ["ADMIN", "TEACHER", "STUDENT", "PARENT", "ACCOUNTANT", "LIBRARIAN"],
  students: ["ADMIN", "TEACHER", "ACCOUNTANT"],
  teachers: ["ADMIN"],
  classes: ["ADMIN", "TEACHER"],
  subjects: ["ADMIN", "TEACHER"],
  attendance: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  timetable: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  exams: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  fees: ["ADMIN", "ACCOUNTANT", "PARENT", "STUDENT"],
  library: ["ADMIN", "LIBRARIAN", "TEACHER", "STUDENT"],
  transport: ["ADMIN", "PARENT", "STUDENT"],
  assignments: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  messages: ["ADMIN", "TEACHER", "STUDENT", "PARENT", "ACCOUNTANT", "LIBRARIAN"],
  announcements: [
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "PARENT",
    "ACCOUNTANT",
    "LIBRARIAN",
  ],
  reports: ["ADMIN", "TEACHER", "ACCOUNTANT"],
  notifications: [
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "PARENT",
    "ACCOUNTANT",
    "LIBRARIAN",
  ],
  settings: ["ADMIN", "TEACHER", "STUDENT", "PARENT", "ACCOUNTANT", "LIBRARIAN"],
};

/** Roles allowed to create/update/delete records in a module. */
export const MODULE_WRITE: Partial<Record<ModuleKey, Role[]>> = {
  students: ["ADMIN"],
  teachers: ["ADMIN"],
  classes: ["ADMIN"],
  subjects: ["ADMIN"],
  attendance: ["ADMIN", "TEACHER"],
  timetable: ["ADMIN"],
  exams: ["ADMIN", "TEACHER"],
  fees: ["ADMIN", "ACCOUNTANT"],
  library: ["ADMIN", "LIBRARIAN"],
  transport: ["ADMIN"],
  assignments: ["ADMIN", "TEACHER"],
  announcements: ["ADMIN", "TEACHER"],
};

export function canAccess(role: Role | undefined, moduleKey: ModuleKey) {
  if (!role) return false;
  return MODULE_ACCESS[moduleKey]?.includes(role) ?? false;
}

export function canWrite(role: Role | undefined, moduleKey: ModuleKey) {
  if (!role) return false;
  return MODULE_WRITE[moduleKey]?.includes(role) ?? false;
}

/** Maps a dashboard pathname (e.g. `/dashboard/students/abc`) to its module. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const segment = pathname.replace(/^\/dashboard\/?/, "").split("/")[0];
  if (!segment) return "dashboard";
  return (segment as ModuleKey) in MODULE_ACCESS ? (segment as ModuleKey) : null;
}
