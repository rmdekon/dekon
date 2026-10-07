import { asc, eq, sql } from "drizzle-orm";
import { Bus, MapPin, Route, Users } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Progress,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import {
  students,
  transportAssignments,
  transportRoutes,
  vehicles,
} from "@/db/schema";
import { formatMoney, percent } from "@/lib/utils";

export const metadata = { title: "Transport" };
export const dynamic = "force-dynamic";

export default async function TransportPage() {
  const [routes, fleet, riders] = await Promise.all([
    db
      .select({
        id: transportRoutes.id,
        name: transportRoutes.name,
        stops: transportRoutes.stops,
        fare: transportRoutes.fare,
        vehicleReg: vehicles.regNumber,
        vehicleModel: vehicles.model,
        capacity: vehicles.capacity,
        driverName: vehicles.driverName,
        driverPhone: vehicles.driverPhone,
        riderCount: sql<number>`(select count(*) from transport_assignments ta where ta.route_id = ${transportRoutes.id})`,
      })
      .from(transportRoutes)
      .leftJoin(vehicles, eq(vehicles.id, transportRoutes.vehicleId))
      .orderBy(asc(transportRoutes.name)),
    db.select().from(vehicles).orderBy(asc(vehicles.regNumber)),
    db
      .select({
        id: transportAssignments.id,
        pickupStop: transportAssignments.pickupStop,
        routeName: transportRoutes.name,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
      })
      .from(transportAssignments)
      .innerJoin(students, eq(students.id, transportAssignments.studentId))
      .innerJoin(transportRoutes, eq(transportRoutes.id, transportAssignments.routeId))
      .orderBy(asc(students.lastName))
      .limit(30),
  ]);

  const totalRiders = routes.reduce((s, r) => s + Number(r.riderCount), 0);
  const totalCapacity = fleet.reduce((s, v) => s + v.capacity, 0);
  const revenue = routes.reduce((s, r) => s + r.fare * Number(r.riderCount), 0);

  return (
    <>
      <PageHeader
        title="Transport"
        description="Fleet, routes, stops and student ridership."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vehicles"
          value={fleet.length}
          hint={`${fleet.filter((v) => v.isActive).length} active`}
          icon={Bus}
          tone="brand"
        />
        <StatCard label="Routes" value={routes.length} icon={Route} tone="violet" />
        <StatCard
          label="Students riding"
          value={totalRiders}
          hint={`${percent(totalRiders, totalCapacity)}% of seat capacity`}
          icon={Users}
          tone="emerald"
        />
        <StatCard
          label="Termly transport revenue"
          value={formatMoney(revenue)}
          hint="fares × riders"
          icon={MapPin}
          tone="amber"
        />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-3">
        {routes.map((r) => {
          const stops = r.stops.split(",").map((s) => s.trim()).filter(Boolean);
          const fill = r.capacity ? percent(Number(r.riderCount), r.capacity) : 0;
          return (
            <Card key={r.id}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink-950">
                      {r.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      {r.vehicleReg ?? "No vehicle"} · {r.vehicleModel ?? "—"}
                    </p>
                  </div>
                  <Badge tone="brand">{formatMoney(r.fare)}</Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-ink-500">
                    <span>Occupancy</span>
                    <span className="font-medium text-ink-800">
                      {Number(r.riderCount)} / {r.capacity ?? "—"}
                    </span>
                  </div>
                  <Progress
                    value={fill}
                    tone={fill > 90 ? "danger" : fill > 70 ? "warning" : "success"}
                  />
                </div>

                <div className="border-t border-ink-100 pt-3">
                  <p className="mb-2 text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                    Stops
                  </p>
                  <ol className="space-y-1.5">
                    {stops.map((stop, i) => (
                      <li
                        key={stop}
                        className="flex items-center gap-2 text-[11px] text-ink-600"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-brand-700">
                          {i + 1}
                        </span>
                        {stop}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="border-t border-ink-100 pt-3 text-[11px]">
                  <p className="text-ink-500">Driver</p>
                  <p className="font-medium text-ink-800">{r.driverName ?? "—"}</p>
                  <p className="text-ink-500">{r.driverPhone ?? ""}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Rider assignments" description={`Showing ${riders.length} students`} />
        {riders.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Admission no.</Th>
                <Th>Route</Th>
                <Th>Pickup stop</Th>
              </tr>
            </thead>
            <tbody>
              {riders.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium text-ink-900">
                    {r.firstName} {r.lastName}
                  </Td>
                  <Td className="font-mono text-xs">{r.admissionNo}</Td>
                  <Td className="text-xs">{r.routeName}</Td>
                  <Td>
                    <Badge tone="neutral">{r.pickupStop ?? "—"}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={<Bus className="h-5 w-5" />} title="No riders assigned" />
        )}
      </Card>
    </>
  );
}
