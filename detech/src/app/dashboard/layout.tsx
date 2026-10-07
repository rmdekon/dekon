import { redirect } from "next/navigation";

import { Topbar } from "@/components/topbar";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh lg:pl-64">
      <Topbar user={user} />
      <main className="animate-rise mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
