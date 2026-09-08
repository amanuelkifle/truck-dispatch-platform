import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

// Section 16 (Financial Dashboard) + Phase 5 of the roadmap. Revenue is
// recognized on delivery: everything here treats a load as "completed" once
// its status reaches delivered / invoiced / paid, regardless of whether the
// invoice has actually been paid yet (that distinction belongs to Phase 6 -
// Documents / invoicing, not here).
const COMPLETED_STATUSES = "('delivered', 'invoiced', 'paid')";

interface OrgSummaryRow {
  gross_revenue: string;
  loads_completed: string;
  loaded_miles: string;
  deadhead_miles: string;
  fuel_estimate: string;
}

interface WeeklyTruckRow {
  id: string;
  truck_number: string;
  driver_name: string | null;
  loads_count: string;
  loaded_miles: string;
  deadhead_miles: string;
  gross_revenue: string;
}

interface TruckFinancialRow {
  id: string;
  truck_number: string;
  driver_name: string | null;
  loads_completed: string;
  loaded_miles: string;
  deadhead_miles: string;
  gross_revenue: string;
  fuel_estimate: string;
}

interface CarrierReportRow {
  id: string;
  name: string;
  truck_count: string;
  loads_completed: string;
  total_gross: string;
  weekly_gross: string;
  monthly_gross: string;
  loaded_miles: string;
  deadhead_miles: string;
}

function toNumber(value: string | null | undefined): number {
  return value ? Number(value) : 0;
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRpm(revenue: number, miles: number): string {
  return miles > 0 ? formatMoney(revenue / miles) : "—";
}

function formatPercent(part: number, whole: number): string {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "—";
}

export default async function FinancialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orgRows = await query<{ organization_id: string }>(
    "select organization_id from users where id = $1",
    [user.id],
  );
  const organizationId = orgRows[0]?.organization_id;

  const [orgSummaryRows, weeklyTrucks, truckFinancials, carrierReport] =
    organizationId
      ? await Promise.all([
          query<OrgSummaryRow>(
            `select coalesce(sum(rate), 0) as gross_revenue,
                    count(*) as loads_completed,
                    coalesce(sum(loaded_miles), 0) as loaded_miles,
                    coalesce(sum(deadhead_miles), 0) as deadhead_miles,
                    coalesce(sum(fuel_estimate), 0) as fuel_estimate
             from loads
             where organization_id = $1
               and status in ${COMPLETED_STATUSES}`,
            [organizationId],
          ),
          query<WeeklyTruckRow>(
            `select t.id, t.truck_number,
                    (d.first_name || ' ' || d.last_name) as driver_name,
                    count(l.id) as loads_count,
                    coalesce(sum(l.loaded_miles), 0) as loaded_miles,
                    coalesce(sum(l.deadhead_miles), 0) as deadhead_miles,
                    coalesce(sum(l.rate), 0) as gross_revenue
             from trucks t
             left join drivers d on d.id = t.driver_id
             left join loads l on l.truck_id = t.id
               and l.delivery_date >= date_trunc('week', current_date)
               and l.delivery_date < date_trunc('week', current_date) + interval '7 days'
             where t.organization_id = $1
             group by t.id, t.truck_number, d.first_name, d.last_name
             order by gross_revenue desc`,
            [organizationId],
          ),
          query<TruckFinancialRow>(
            `select t.id, t.truck_number,
                    (d.first_name || ' ' || d.last_name) as driver_name,
                    count(l.id) as loads_completed,
                    coalesce(sum(l.loaded_miles), 0) as loaded_miles,
                    coalesce(sum(l.deadhead_miles), 0) as deadhead_miles,
                    coalesce(sum(l.rate), 0) as gross_revenue,
                    coalesce(sum(l.fuel_estimate), 0) as fuel_estimate
             from trucks t
             left join drivers d on d.id = t.driver_id
             left join loads l on l.truck_id = t.id
               and l.status in ${COMPLETED_STATUSES}
             where t.organization_id = $1
             group by t.id, t.truck_number, d.first_name, d.last_name
             order by gross_revenue desc`,
            [organizationId],
          ),
          query<CarrierReportRow>(
            `select c.id, c.name,
                    (select count(*) from trucks t where t.carrier_id = c.id) as truck_count,
                    (select count(*) from loads l
                     where l.carrier_id = c.id and l.status in ${COMPLETED_STATUSES}) as loads_completed,
                    (select coalesce(sum(l.rate), 0) from loads l
                     where l.carrier_id = c.id and l.status in ${COMPLETED_STATUSES}) as total_gross,
                    (select coalesce(sum(l.rate), 0) from loads l
                     where l.carrier_id = c.id and l.status in ${COMPLETED_STATUSES}
                       and l.delivery_date >= date_trunc('week', current_date)
                       and l.delivery_date < date_trunc('week', current_date) + interval '7 days') as weekly_gross,
                    (select coalesce(sum(l.rate), 0) from loads l
                     where l.carrier_id = c.id and l.status in ${COMPLETED_STATUSES}
                       and l.delivery_date >= date_trunc('month', current_date)
                       and l.delivery_date < date_trunc('month', current_date) + interval '1 month') as monthly_gross,
                    (select coalesce(sum(l.loaded_miles), 0) from loads l
                     where l.carrier_id = c.id and l.status in ${COMPLETED_STATUSES}) as loaded_miles,
                    (select coalesce(sum(l.deadhead_miles), 0) from loads l
                     where l.carrier_id = c.id and l.status in ${COMPLETED_STATUSES}) as deadhead_miles
             from carriers c
             where c.organization_id = $1
             order by c.name`,
            [organizationId],
          ),
        ])
      : [[{ gross_revenue: "0", loads_completed: "0", loaded_miles: "0", deadhead_miles: "0", fuel_estimate: "0" }], [], [], []];

  const orgSummary = orgSummaryRows[0];
  const grossRevenue = toNumber(orgSummary?.gross_revenue);
  const loadedMiles = toNumber(orgSummary?.loaded_miles);
  const deadheadMiles = toNumber(orgSummary?.deadhead_miles);
  const totalMiles = loadedMiles + deadheadMiles;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Analytics</h1>
        <p className="text-sm text-neutral-500">
          Based on completed loads (delivered, invoiced, or paid).
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Gross revenue</p>
          <p className="text-xl font-semibold">{formatMoney(grossRevenue)}</p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Loads completed</p>
          <p className="text-xl font-semibold">{toNumber(orgSummary?.loads_completed)}</p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Avg loaded RPM</p>
          <p className="text-xl font-semibold">{formatRpm(grossRevenue, loadedMiles)}</p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Avg effective RPM</p>
          <p className="text-xl font-semibold">{formatRpm(grossRevenue, totalMiles)}</p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Deadhead miles</p>
          <p className="text-xl font-semibold">
            {deadheadMiles.toLocaleString()}{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({formatPercent(deadheadMiles, totalMiles)})
            </span>
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Fuel estimate</p>
          <p className="text-xl font-semibold">{formatMoney(toNumber(orgSummary?.fuel_estimate))}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Weekly truck revenue</h2>
        {weeklyTrucks.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No trucks yet.{" "}
            <Link href="/trucks/new" className="underline">
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 font-medium">Truck</th>
                  <th className="px-4 py-2 font-medium">Driver</th>
                  <th className="px-4 py-2 font-medium">Loads this week</th>
                  <th className="px-4 py-2 font-medium">Loaded miles</th>
                  <th className="px-4 py-2 font-medium">Deadhead miles</th>
                  <th className="px-4 py-2 font-medium">Gross revenue</th>
                  <th className="px-4 py-2 font-medium">RPM</th>
                </tr>
              </thead>
              <tbody>
                {weeklyTrucks.map((row) => {
                  const revenue = toNumber(row.gross_revenue);
                  const miles = toNumber(row.loaded_miles) + toNumber(row.deadhead_miles);
                  return (
                    <tr key={row.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-3 font-medium">{row.truck_number}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {row.driver_name?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{row.loads_count}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.loaded_miles}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.deadhead_miles}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatMoney(revenue)}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatRpm(revenue, miles)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Per-truck summary</h2>
        {truckFinancials.length === 0 ? (
          <p className="text-sm text-neutral-500">No trucks yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 font-medium">Truck</th>
                  <th className="px-4 py-2 font-medium">Driver</th>
                  <th className="px-4 py-2 font-medium">Loads completed</th>
                  <th className="px-4 py-2 font-medium">Loaded miles</th>
                  <th className="px-4 py-2 font-medium">Deadhead miles</th>
                  <th className="px-4 py-2 font-medium">Gross revenue</th>
                  <th className="px-4 py-2 font-medium">Avg loaded RPM</th>
                  <th className="px-4 py-2 font-medium">Avg effective RPM</th>
                  <th className="px-4 py-2 font-medium">Fuel estimate</th>
                </tr>
              </thead>
              <tbody>
                {truckFinancials.map((row) => {
                  const revenue = toNumber(row.gross_revenue);
                  const loaded = toNumber(row.loaded_miles);
                  const deadhead = toNumber(row.deadhead_miles);
                  return (
                    <tr key={row.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-3 font-medium">{row.truck_number}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {row.driver_name?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{row.loads_completed}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.loaded_miles}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.deadhead_miles}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatMoney(revenue)}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatRpm(revenue, loaded)}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatRpm(revenue, loaded + deadhead)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatMoney(toNumber(row.fuel_estimate))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Carrier reporting</h2>
        {carrierReport.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No carriers yet.{" "}
            <Link href="/carriers/new" className="underline">
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 font-medium">Carrier</th>
                  <th className="px-4 py-2 font-medium">Trucks</th>
                  <th className="px-4 py-2 font-medium">Weekly gross</th>
                  <th className="px-4 py-2 font-medium">Monthly gross</th>
                  <th className="px-4 py-2 font-medium">Avg RPM</th>
                  <th className="px-4 py-2 font-medium">Revenue / truck</th>
                  <th className="px-4 py-2 font-medium">Deadhead %</th>
                  <th className="px-4 py-2 font-medium">Loads / truck</th>
                </tr>
              </thead>
              <tbody>
                {carrierReport.map((row) => {
                  const trucks = toNumber(row.truck_count);
                  const loadsCompleted = toNumber(row.loads_completed);
                  const totalGross = toNumber(row.total_gross);
                  const loaded = toNumber(row.loaded_miles);
                  const deadhead = toNumber(row.deadhead_miles);
                  const totalMilesForCarrier = loaded + deadhead;

                  return (
                    <tr key={row.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-neutral-500">{trucks}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatMoney(toNumber(row.weekly_gross))}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatMoney(toNumber(row.monthly_gross))}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatRpm(totalGross, totalMilesForCarrier)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {trucks > 0 ? formatMoney(totalGross / trucks) : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatPercent(deadhead, totalMilesForCarrier)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {trucks > 0 ? (loadsCompleted / trucks).toFixed(1) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
