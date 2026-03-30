import type { Rsvp } from "@prisma/client";

// ─── Response DTOs ──────────────────────────────────────

export interface RsvpResponse {
  id: number;
  weddingId: number;
  attendance: string;
  name: string;
  side: string;
  phone: string;
  attendeeCount: number;
  meal: { willEat: boolean; mealCount: number };
  shuttle: { willRide: boolean; rideCount: number };
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

// ─── Mapper ─────────────────────────────────────────────

export function toRsvpResponse(rsvp: Rsvp): RsvpResponse {
  return {
    id: rsvp.id,
    weddingId: rsvp.weddingId,
    attendance: rsvp.attendance,
    name: rsvp.name,
    side: rsvp.side,
    phone: rsvp.phone,
    attendeeCount: rsvp.attendeeCount,
    meal: { willEat: rsvp.willEat, mealCount: rsvp.mealCount },
    shuttle: { willRide: rsvp.willRide, rideCount: rsvp.rideCount },
    note: rsvp.note,
    consent: rsvp.consent,
    createdAt: rsvp.createdAt.toISOString(),
    updatedAt: rsvp.updatedAt.toISOString(),
  };
}
