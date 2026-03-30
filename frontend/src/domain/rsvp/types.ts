// ─── Enums ──────────────────────────────────────────────

export type RsvpAttendance = "YES" | "NO";
export type RsvpSide = "BRIDE" | "GROOM";

// ─── Nested Types ───────────────────────────────────────

export interface RsvpMeal {
  willEat: boolean;
  mealCount: number;
}

export interface RsvpShuttle {
  willRide: boolean;
  rideCount: number;
}

// ─── Request DTOs ────────────────────────────────────────

export interface RsvpCreateRequest {
  weddingId: number;
  attendance: RsvpAttendance;
  name: string;
  side: RsvpSide;
  phone: string;
  attendeeCount: number;
  meal: RsvpMeal;
  shuttle: RsvpShuttle;
  note: string;
  consent: boolean;
}

export interface RsvpUpdateRequest {
  attendance: RsvpAttendance;
  name: string;
  side: RsvpSide;
  phone: string;
  attendeeCount: number;
  meal: RsvpMeal;
  shuttle: RsvpShuttle;
  note: string;
}

// ─── Response DTOs ──────────────────────────────────────

export interface RsvpResponse {
  id: number;
  weddingId: number;
  sessionId: string;
  attendance: RsvpAttendance;
  name: string;
  side: RsvpSide;
  phone: string;
  attendeeCount: number;
  meal: RsvpMeal;
  shuttle: RsvpShuttle;
  note: string | null;
  consent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpStatsResponse {
  totalRsvpCount: number;
  attendingCount: number;
  totalAttendeeCount: number;
  totalMealCount: number;
  totalShuttleCount: number;
}

export interface RsvpListResponse {
  items: RsvpResponse[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
}

// ─── Form Types ─────────────────────────────────────────

export interface RsvpFormValues {
  attendance: RsvpAttendance;
  name: string;
  side: RsvpSide;
  phone: string;
  attendeeCount: number;
  meal: RsvpMeal;
  shuttle: RsvpShuttle;
  note: string;
  consent: boolean;
}
