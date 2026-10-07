import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboards/admin";
import { ParentDashboard } from "@/components/dashboards/parent";
import { StudentDashboard } from "@/components/dashboards/student";
import { TeacherDashboard } from "@/components/dashboards/teacher";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { denied } = await searchParams;

  const banner = denied ? (
    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Your role (<strong>{user.role}</strong>) does not have access to that
      section.
    </div>
  ) : null;

  switch (user.role) {
    case "STUDENT":
      return (
        <>
          {banner}
          <StudentDashboard user={user} />
        </>
      );
    case "PARENT":
      return (
        <>
          {banner}
          <ParentDashboard user={user} />
        </>
      );
    case "TEACHER":
      return (
        <>
          {banner}
          <TeacherDashboard user={user} />
        </>
      );
    default:
      // ADMIN, ACCOUNTANT, LIBRARIAN all get the institutional view.
      return (
        <>
          {banner}
          <AdminDashboard user={user} />
        </>
      );
  }
}
