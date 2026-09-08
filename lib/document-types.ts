export type DocumentType =
  | "rate_confirmation"
  | "bol"
  | "pod"
  | "carrier_packet"
  | "other";

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "rate_confirmation", label: "Rate Confirmation" },
  { value: "bol", label: "BOL (Bill of Lading)" },
  { value: "pod", label: "POD (Proof of Delivery)" },
  { value: "carrier_packet", label: "Carrier Packet" },
  { value: "other", label: "Other" },
];
