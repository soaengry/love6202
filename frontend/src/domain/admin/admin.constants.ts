export const ADMIN_API = {
  WEDDINGS: "/admin/weddings",
  SEARCH_USERS: "/admin/users/search",
  CHANGE_ROLE: (id: number) => `/admin/users/${id}/role`,
} as const;
