// ~/constants/userRole.ts
export const UserRole = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
} as const

export type UserRoleType = typeof UserRole[keyof typeof UserRole]