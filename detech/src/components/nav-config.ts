import {
  BarChart3,
  Bell,
  Bus,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Library,
  Megaphone,
  MessagesSquare,
  NotebookPen,
  School,
  Settings,
  Users,
  UserSquare2,
  type LucideIcon,
} from "lucide-react";

import type { ModuleKey } from "@/lib/rbac";

export type NavItem = {
  key: ModuleKey;
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "People" | "Academics" | "Operations" | "Communication" | "System";
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { key: "reports", href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3, group: "Overview" },

  { key: "students", href: "/dashboard/students", label: "Students", icon: Users, group: "People" },
  { key: "teachers", href: "/dashboard/teachers", label: "Teachers", icon: UserSquare2, group: "People" },

  { key: "classes", href: "/dashboard/classes", label: "Classes", icon: School, group: "Academics" },
  { key: "subjects", href: "/dashboard/subjects", label: "Subjects", icon: GraduationCap, group: "Academics" },
  { key: "attendance", href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, group: "Academics" },
  { key: "timetable", href: "/dashboard/timetable", label: "Timetable", icon: CalendarDays, group: "Academics" },
  { key: "exams", href: "/dashboard/exams", label: "Exams & Grading", icon: NotebookPen, group: "Academics" },
  { key: "assignments", href: "/dashboard/assignments", label: "Assignments", icon: NotebookPen, group: "Academics" },

  { key: "fees", href: "/dashboard/fees", label: "Fees & Payments", icon: CreditCard, group: "Operations" },
  { key: "library", href: "/dashboard/library", label: "Library", icon: Library, group: "Operations" },
  { key: "transport", href: "/dashboard/transport", label: "Transport", icon: Bus, group: "Operations" },

  { key: "announcements", href: "/dashboard/announcements", label: "Announcements", icon: Megaphone, group: "Communication" },
  { key: "messages", href: "/dashboard/messages", label: "Messages", icon: MessagesSquare, group: "Communication" },
  { key: "notifications", href: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Communication" },

  { key: "settings", href: "/dashboard/settings", label: "Settings", icon: Settings, group: "System" },
];

export const NAV_GROUP_ORDER = [
  "Overview",
  "People",
  "Academics",
  "Operations",
  "Communication",
  "System",
] as const;
