// Core domain types for the truck dispatch platform.
// These mirror the entities and enums defined in docs/PROJECT_PLAN.md
// (sections 4, 6-9, 14, 23-24) and will grow as each module is built.

// --- Multi-tenancy & users (section 24) ---

export type UserRole =
  | "platform_admin"
  | "dispatch_company"
  | "carrier"
  | "dispatcher";

// --- Billing (Stripe subscriptions) ---

export type PlanTier = "starter" | "growth" | "enterprise";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: PlanTier | null;
  subscriptionStatus?: SubscriptionStatus | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
}

// An organization can use the app while trialing or active. past_due gets
// a grace period (still counted as access here - the dashboard surfaces a
// warning instead of a hard lock, since Stripe is already retrying the
// card automatically); canceled/incomplete/null (never subscribed) do not.
export function hasActiveAccess(
  org: Pick<Organization, "subscriptionStatus">,
): boolean {
  return (
    org.subscriptionStatus === "trialing" ||
    org.subscriptionStatus === "active" ||
    org.subscriptionStatus === "past_due"
  );
}

export interface AppUser {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
}

// --- Carrier (section 6) ---

export type CarrierStatus = "active" | "inactive" | "pending" | "suspended";

export interface Carrier {
  id: string;
  organizationId: string;
  name: string;
  mcNumber: string;
  dotNumber: string;
  address: string;
  phone: string;
  email: string;
  dispatcher: string;
  insuranceExpiration: string;
  authorityStatus: string;
  equipmentTypes: EquipmentType[];
  preferredLanes: string[];
  homeState: string;
  notes: string;
  status: CarrierStatus;
}

// --- Driver (section 7) ---

export type DriverStatus = "active" | "inactive" | "on_leave";

export interface Driver {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  carrierId: string;
  truckId?: string;
  currentLocation: string;
  homeLocation: string;
  availableDate: string;
  preferredLanes: string[];
  homeTimeRequirement: string;
  hoursAvailable: number;
  notes: string;
  status: DriverStatus;
}

// --- Truck (section 8) ---

export type EquipmentType =
  | "dry_van"
  | "reefer"
  | "flatbed"
  | "step_deck"
  | "power_only"
  | "box_truck"
  | "hotshot"
  | "rgn"
  | "other";

export type TruckStatus =
  | "available"
  | "searching"
  | "booked"
  | "at_pickup"
  | "in_transit"
  | "at_delivery"
  | "delivered"
  | "out_of_service";

export interface Truck {
  id: string;
  organizationId: string;
  truckNumber: string;
  carrierId: string;
  driverId?: string;
  vin: string;
  equipmentType: EquipmentType;
  trailerNumber: string;
  currentCity: string;
  currentState: string;
  currentLatitude?: number;
  currentLongitude?: number;
  availableDate: string;
  availableTime: string;
  status: TruckStatus;
}

// --- Broker (section 14) ---

export type BrokerStatus = "active" | "inactive" | "pending" | "suspended";

export interface Broker {
  id: string;
  organizationId: string;
  name: string;
  mcNumber: string;
  dotNumber: string;
  phone: string;
  email: string;
  website: string;
  paymentTerms: string;
  creditRating: string;
  averageRate: number;
  averageDaysToPay: number;
  loadsCompleted: number;
  claims: number;
  dispatcherRating: number;
  notes: string;
  status: BrokerStatus;
}

// --- Load (section 9) ---

export type LoadStatus =
  | "potential"
  | "negotiating"
  | "booked"
  | "dispatched"
  | "at_pickup"
  | "loaded"
  | "in_transit"
  | "at_delivery"
  | "delivered"
  | "invoiced"
  | "paid"
  | "cancelled";

export interface Load {
  id: string;
  organizationId: string;
  loadNumber: string;
  brokerId: string;
  carrierId: string;
  truckId?: string;
  driverId?: string;
  origin: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  commodity: string;
  weight: number;
  trailerType: EquipmentType;
  loadedMiles: number;
  deadheadMiles: number;
  rate: number;
  fuelEstimate: number;
  tolls: number;
  status: LoadStatus;
  notes: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

// --- Load profitability (section 11) ---

export interface LoadProfitability {
  totalMiles: number;
  loadedRatePerMile: number;
  effectiveRatePerMile: number;
}

export function calculateLoadProfitability(
  load: Pick<Load, "rate" | "loadedMiles" | "deadheadMiles">,
): LoadProfitability {
  const totalMiles = load.loadedMiles + load.deadheadMiles;
  const loadedRatePerMile = load.loadedMiles > 0 ? load.rate / load.loadedMiles : 0;
  const effectiveRatePerMile = totalMiles > 0 ? load.rate / totalMiles : 0;

  return {
    totalMiles,
    loadedRatePerMile,
    effectiveRatePerMile,
  };
}
