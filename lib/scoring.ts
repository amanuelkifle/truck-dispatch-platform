import { haversineMiles } from "@/lib/mapbox";

// Phase 7 (Load Scoring). Section 12 of docs/PROJECT_PLAN.md describes a
// score built from rate/mile, destination market strength, reload
// probability, home-time match, lane match, deadhead, fuel/toll cost, HOS
// risk, detention risk, and broker risk. Several of those (market strength,
// true reload probability from live load-board data, HOS, detention) need
// data sources this app doesn't have (a load-board feed, ELD integration) -
// see docs/ROADMAP.md's Phase 7 note for what's deferred and why.
//
// What's built here uses only data already in this app: net rate per mile,
// deadhead percentage, a lane-preference match, a "reload" proxy (how many
// of your OTHER open loads originate near this load's destination - a
// stand-in for true market reload probability, computed from your own
// pipeline instead of a live feed), and a broker-status risk flag.
//
// Every sub-score is 0-100 so they combine into a familiar "out of 100"
// overall score, the same style as the worked example in section 12.

export interface LoadScoreInput {
  rate: number;
  fuelEstimate: number;
  tolls: number;
  loadedMiles: number;
  deadheadMiles: number;
  /** "Origin-Destination" style strings from the carrier's and/or driver's preferred_lanes. */
  preferredLanes: string[];
  origin: string | null;
  destination: string | null;
  /** Count of the org's OTHER open loads whose origin is near this load's destination. */
  reloadCount: number;
  /** null = no broker linked. */
  brokerStatus: string | null;
}

export interface LoadScoreBreakdown {
  rpmScore: number;
  deadheadScore: number;
  laneScore: number;
  reloadScore: number;
  brokerScore: number;
  overallScore: number;
  netRatePerMile: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// The "reload" proxy: how many of the org's OTHER open loads originate
// within `radiusMiles` of a given destination. Used as a stand-in for true
// market reload probability (which would need a live load-board feed) -
// see the file header comment. `radiusMiles` defaults to 75, a rough
// "same general market" cutoff.
export function countNearbyOrigins(
  destination: { lat: number; lng: number } | null,
  pool: { id: string; originLat: number | null; originLng: number | null }[],
  excludeId: string,
  radiusMiles = 75,
): number {
  if (!destination) return 0;
  let count = 0;
  for (const candidate of pool) {
    if (candidate.id === excludeId) continue;
    if (candidate.originLat == null || candidate.originLng == null) continue;
    const distance = haversineMiles(destination, {
      lat: candidate.originLat,
      lng: candidate.originLng,
    });
    if (distance <= radiusMiles) count++;
  }
  return count;
}

// Tunable baseline: $1.50/mile nets a 0, $4.00/mile nets a 100. Adjust these
// two numbers if your typical lanes run richer or leaner than that.
const RPM_FLOOR = 1.5;
const RPM_CEILING = 4.0;

// A lane string like "Atlanta-Nashville" matches a load if one side
// (loosely) appears in the origin and the other in the destination, in
// either direction (covers backhaul lanes too).
function matchesLane(lane: string, origin: string, destination: string): boolean {
  const parts = lane.split("-").map((p) => p.trim().toLowerCase());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [a, b] = parts;
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();
  return (o.includes(a) && d.includes(b)) || (o.includes(b) && d.includes(a));
}

export function calculateLoadScore(input: LoadScoreInput): LoadScoreBreakdown {
  const totalMiles = input.loadedMiles + input.deadheadMiles;
  const netRevenue = input.rate - input.fuelEstimate - input.tolls;
  const netRatePerMile = totalMiles > 0 ? netRevenue / totalMiles : 0;

  const rpmScore = clamp(
    ((netRatePerMile - RPM_FLOOR) / (RPM_CEILING - RPM_FLOOR)) * 100,
    0,
    100,
  );

  const deadheadPct = totalMiles > 0 ? (input.deadheadMiles / totalMiles) * 100 : 0;
  const deadheadScore = clamp(100 - deadheadPct * 2, 0, 100);

  let laneScore = 50; // neutral when no preferred lanes are on file
  if (input.preferredLanes.length > 0 && input.origin && input.destination) {
    const matched = input.preferredLanes.some((lane) =>
      matchesLane(lane, input.origin as string, input.destination as string),
    );
    laneScore = matched ? 100 : 30;
  }

  const reloadScore = clamp(input.reloadCount * 25, 0, 100);

  const brokerScore =
    input.brokerStatus === null
      ? 50 // unknown - no broker linked yet
      : input.brokerStatus === "active"
        ? 100
        : 0; // suspended / inactive / pending

  const overallScore =
    rpmScore * 0.35 +
    deadheadScore * 0.25 +
    reloadScore * 0.2 +
    laneScore * 0.1 +
    brokerScore * 0.1;

  return {
    rpmScore: Math.round(rpmScore),
    deadheadScore: Math.round(deadheadScore),
    laneScore: Math.round(laneScore),
    reloadScore: Math.round(reloadScore),
    brokerScore: Math.round(brokerScore),
    overallScore: Math.round(overallScore),
    netRatePerMile,
  };
}
