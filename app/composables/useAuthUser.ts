import { UserRole } from '~/constants/userRole'
import { fetchInternalMe } from '~/services/auth'
import type { AuthInternalMeData } from '~/types/auth'

export const useAuthUser = () => {
  const user = useState<AuthInternalMeData | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-user-loading', () => false)

  const isSuperAdmin = computed(() => user.value?.role === UserRole.SUPERADMIN)

  const fetchUser = async (force = false) => {
    if (user.value && !force) {
      return user.value
    }

    isLoading.value = true

    try {
      user.value = await fetchInternalMe()
      return user.value
    } catch (error) {
      user.value = null
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const clearUser = () => {
    user.value = null
  }

  return {
    user,
    isLoading,
    isSuperAdmin,
    fetchUser,
    clearUser
  }
}
