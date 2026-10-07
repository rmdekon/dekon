import { handler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  getAttendanceBreakdown,
  getAttendanceTrend,
  getEnrollmentByClass,
  getFinanceSummary,
  getGradeDistribution,
  getLibraryStats,
  getMonthlyCollections,
  getSchoolStats,
  getSubjectAverages,
  getTransportStats,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/stats — everything the dashboards render, as JSON. */
export const GET = handler(async () => {
  await requireSession();

  const [
    school,
    attendanceTrend,
    attendanceBreakdown,
    finance,
    collections,
    grades,
    subjectAverages,
    enrollment,
    library,
    transport,
  ] = await Promise.all([
    getSchoolStats(),
    getAttendanceTrend(14),
    getAttendanceBreakdown(30),
    getFinanceSummary(),
    getMonthlyCollections(6),
    getGradeDistribution(),
    getSubjectAverages(),
    getEnrollmentByClass(),
    getLibraryStats(),
    getTransportStats(),
  ]);

  return ok({
    school,
    attendance: { trend: attendanceTrend, breakdown: attendanceBreakdown },
    finance: { ...finance, monthlyCollections: collections },
    academics: { grades, subjectAverages, enrollment },
    operations: { library, transport },
  });
});
