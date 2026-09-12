"use client";

import { useMemo, useState } from "react";
import type { Organization } from "@/lib/types";

type StageKey = "noPlan" | "trialing" | "active" | "pastDue" | "canceled" | "incomplete";

const STAGE_META: Record<StageKey, { label: string; hint: string }> = {
  noPlan: { label: "No plan yet", hint: "Signed up, never subscribed" },
  trialing: { label: "Trialing", hint: "14-day trial in progress" },
  active: { label: "Active", hint: "Paying, in good standing" },
  pastDue: { label: "Past due", hint: "Card failed, Stripe retrying" },
  canceled: { label: "Canceled", hint: "Subscription ended" },
  incomplete: { label: "Incomplete", hint: "Checkout started, never finished" },
};

const STAGE_BORDER: Record<StageKey, string> = {
  noPlan: "border-neutral-300 dark:border-neutral-700",
  trialing: "border-sky-300 dark:border-sky-800",
  active: "border-emerald-300 dark:border-emerald-800",
  pastDue: "border-amber-300 dark:border-amber-800",
  canceled: "border-red-300 dark:border-red-900",
  incomplete: "border-neutral-300 dark:border-neutral-700",
};

const STAGE_BG: Record<StageKey, string> = {
  noPlan: "bg-neutral-50 dark:bg-neutral-900",
  trialing: "bg-sky-50 dark:bg-sky-950",
  active: "bg-emerald-50 dark:bg-emerald-950",
  pastDue: "bg-amber-50 dark:bg-amber-950",
  canceled: "bg-red-50 dark:bg-red-950",
  incomplete: "bg-neutral-50 dark:bg-neutral-900",
};

function stageOf(org: Organization): StageKey {
  switch (org.subscriptionStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "pastDue";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    default:
      return "noPlan";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BillingFlowClient({ organizations }: { organizations: Organization[] }) {
  const [selected, setSelected] = useState<StageKey | null>(null);

  const grouped = useMemo(() => {
    const map: Record<StageKey, Organization[]> = {
      noPlan: [],
      trialing: [],
      active: [],
      pastDue: [],
      canceled: [],
      incomplete: [],
    };
    for (const org of organizations) {
      map[stageOf(org)].push(org);
    }
    return map;
  }, [organizations]);

  const selectedOrgs = selected ? grouped[selected] : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Main path</p>
        <div className="flex flex-wrap items-stretch gap-3">
          <StageCard
            stageKey="noPlan"
            count={grouped.noPlan.length}
            selected={selected === "noPlan"}
            onClick={() => setSelected("noPlan")}
          />
          <Arrow />
          <StageCard
            stageKey="trialing"
            count={grouped.trialing.length}
            selected={selected === "trialing"}
            onClick={() => setSelected("trialing")}
          />
          <Arrow />
          <StageCard
            stageKey="active"
            count={grouped.active.length}
            selected={selected === "active"}
            onClick={() => setSelected("active")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          When a charge fails
        </p>
        <div className="flex flex-wrap items-stretch gap-3">
          <StageCard
            stageKey="pastDue"
            count={grouped.pastDue.length}
            selected={selected === "pastDue"}
            onClick={() => setSelected("pastDue")}
          />
          <Arrow />
          <StageCard
            stageKey="canceled"
            count={grouped.canceled.length}
            selected={selected === "canceled"}
            onClick={() => setSelected("canceled")}
          />
          {grouped.incomplete.length > 0 && (
            <>
              <span className="self-center text-neutral-300 dark:text-neutral-700">&middot;</span>
              <StageCard
                stageKey="incomplete"
                count={grouped.incomplete.length}
                selected={selected === "incomplete"}
                onClick={() => setSelected("incomplete")}
              />
            </>
          )}
        </div>
      </div>

      {selected && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <p className="font-medium">
              {STAGE_META[selected].label}{" "}
              <span className="font-normal text-neutral-500">
                &middot; {selectedOrgs.length} organization{selectedOrgs.length === 1 ? "" : "s"}
              </span>
            </p>
          </div>
          {selectedOrgs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">Nothing here right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                    <th className="px-4 py-2">Organization</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Trial ends</th>
                    <th className="px-4 py-2">Current period ends</th>
                    <th className="px-4 py-2">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrgs.map((org) => (
                    <tr key={org.id} className="border-t border-neutral-100 dark:border-neutral-900">
                      <td className="px-4 py-2 font-medium">{org.name}</td>
                      <td className="px-4 py-2 text-neutral-500">{org.plan ?? "—"}</td>
                      <td className="px-4 py-2 text-neutral-500">{formatDate(org.trialEndsAt)}</td>
                      <td className="px-4 py-2 text-neutral-500">{formatDate(org.currentPeriodEnd)}</td>
                      <td className="px-4 py-2 text-neutral-500">{formatDate(org.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return <span className="self-center text-neutral-300 dark:text-neutral-700">&rarr;</span>;
}

function StageCard({
  stageKey,
  count,
  selected,
  onClick,
}: {
  stageKey: StageKey;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = STAGE_META[stageKey];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-w-[150px] flex-col items-start gap-1 rounded-lg border-2 px-4 py-3 text-left transition",
        STAGE_BG[stageKey],
        selected ? "border-neutral-900 dark:border-white" : STAGE_BORDER[stageKey],
      ].join(" ")}
    >
      <span className="text-2xl font-semibold tabular-nums">{count}</span>
      <span className="text-sm font-medium">{meta.label}</span>
      <span className="text-xs text-neutral-500">{meta.hint}</span>
    </button>
  );
}
