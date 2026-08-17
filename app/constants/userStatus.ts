// ~/constants/userStatus.ts
export const UserStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
} as const

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus]