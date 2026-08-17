import type { UserRoleType } from "~/constants/userRole"
import type { UserStatusType } from "~/constants/userStatus"



export interface UserItem {
  id: string
  email: string
  username: string
  full_name: string
  role: UserRoleType
  status: UserStatusType
  created_at: string
  updated_at: string
}

export interface UserCreatePayload {
  email: string
  username: string
  full_name: string
  password: string
  role: number
  status: number
}

export interface UserUpdatePayload {
  email?: string
  username?: string
  full_name?: string
  password?: string
  role?: number
  status?: number
}

export interface UsersResponse {
  message: string
  data: UserItem[]
}

export interface UserResponse {
  message: string
  data: UserItem
}
