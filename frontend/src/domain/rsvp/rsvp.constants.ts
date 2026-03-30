export const RSVP_API = {
  BASE: "/rsvp",
  ME: "/rsvp/me",
  STATS: "/rsvp/stats",
  LIST: "/rsvp/list",
  EXPORT: "/rsvp/export",
} as const;

export const RSVP_VALIDATION = {
  PAGE_SIZE: 20,
  NOTE_MAX_LENGTH: 50,
  MAX_ATTENDEE_COUNT: 99,
  MAX_MEAL_COUNT: 99,
  MAX_SHUTTLE_COUNT: 99,
} as const;
