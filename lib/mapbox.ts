// Mapbox integration for Phase 7 (Load Scoring / truck-load matching).
// Server-only - MAPBOX_ACCESS_TOKEN must never get a NEXT_PUBLIC_ prefix.
//
// Two things this is used for, deliberately kept cheap:
//   1. Geocoding (lib/actions/trucks.ts, lib/actions/loads.ts): turn a
//      free-text "City, ST" into coordinates once, when a truck/load is
//      created or edited, and store the result. This is the only place
//      that calls the Geocoding API.
//   2. Driving distance for the truck/load matching view
//      (app/matching/page.tsx): a single Matrix API call per truck,
//      covering every candidate load at once (1 truck x N loads = 1
//      request, not N requests).
// Everything else that needs a rough distance (the reload score, the
// deadhead shown on the Loads list) uses the haversineMiles() straight-line
// calculation below instead of an API call, since those run on every page
// load and a straight-line estimate is good enough for ranking purposes.

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocode(place: string): Promise<LatLng | null> {
  const query = place.trim();
  if (!MAPBOX_TOKEN || !query) {
    return null;
  }

  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=1&access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const feature = data?.features?.[0];
    const coordinates = feature?.geometry?.coordinates; // [lng, lat]
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return null;
    }
    return { lng: coordinates[0], lat: coordinates[1] };
  } catch {
    // Geocoding is best-effort - a network hiccup or bad address should
    // never block creating/editing a truck or load.
    return null;
  }
}

// Real driving distance (miles) from one origin to many destinations in a
// single request. Returns null for any destination Mapbox couldn't route to
// (or if the whole call fails / no token is configured), same length/order
// as `destinations`.
export async function drivingDistancesMiles(
  origin: LatLng,
  destinations: LatLng[],
): Promise<(number | null)[]> {
  if (!MAPBOX_TOKEN || destinations.length === 0) {
    return destinations.map(() => null);
  }

  const points = [origin, ...destinations];
  const coordinateList = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const destinationIndexes = destinations.map((_, i) => i + 1).join(";");

  const url =
    `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinateList}` +
    `?sources=0&destinations=${destinationIndexes}&annotations=distance&access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return destinations.map(() => null);
    }
    const data = await response.json();
    const row: (number | null)[] = data?.distances?.[0] ?? [];
    return destinations.map((_, i) => {
      const meters = row[i];
      return typeof meters === "number" ? meters / 1609.344 : null;
    });
  } catch {
    return destinations.map(() => null);
  }
}

// Straight-line distance in miles (Haversine formula) - free, instant, used
// for anything computed on every page load (reload score, list-view
// estimates) rather than the real driving distance above.
export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}
