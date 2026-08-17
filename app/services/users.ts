import { useApi } from '~/composables/useApi'
import type {
  UserCreatePayload,
  UserItem,
  UserResponse,
  UsersResponse,
  UserUpdatePayload
} from '~/types/users'

export const fetchUsers = async (): Promise<UserItem[]> => {
  const api = useApi()
  const response = await api<UsersResponse>('/internal/users')
  return response.data
}

export const createUser = async (payload: UserCreatePayload): Promise<UserItem> => {
  const api = useApi()
  const response = await api<UserResponse>('/internal/users', {
    method: 'POST',
    body: payload
  })
  return response.data
}

export const updateUser = async (id: string, payload: UserUpdatePayload): Promise<UserItem> => {
  const api = useApi()
  const response = await api<UserResponse>(`/internal/users/${id}`, {
    method: 'PUT',
    body: payload
  })
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  const api = useApi()
  await api(`/internal/users/${id}`, { method: 'DELETE' })
}
