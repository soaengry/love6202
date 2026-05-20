export const ADMIN_API = {
  WEDDINGS: "/admin/weddings",
  PIN_WEDDING: (id: number) => `/admin/weddings/${id}/pin`,
  SEARCH_USERS: "/admin/users/search",
  CHANGE_ROLE: (id: number) => `/admin/users/${id}/role`,
} as const;
