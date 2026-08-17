import { UserRole } from '~/constants/userRole'
import { clearAuthToken, fetchInternalMe } from '~/services/auth'
import type { AuthInternalMeData } from '~/types/auth'

export const useAuthUser = () => {
  const user = useState<AuthInternalMeData | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-user-loading', () => false)
  const fetchUserPromise = ref<Promise<AuthInternalMeData | null> | null>(null)
  const isSuperAdmin = computed(() => user.value?.role === UserRole.SUPERADMIN)

  const fetchUser = async (force = false) => {
    if (user.value && !force) {
      return user.value
    }

    if (!force && fetchUserPromise.value) {
      return fetchUserPromise.value
    }

    const hasInternalToken = !!useCookie('internal_access_token').value

    if (!hasInternalToken && !force) {
      user.value = null
      return null
    }

    isLoading.value = true

    const request = (async () => {
      try {
        const data = await fetchInternalMe()
        user.value = data
        return data
      } catch (error) {
        user.value = null
        clearAuthToken('internal')
        clearAuthToken('app')

        if ((error as { status?: number })?.status === 401) {
          if (import.meta.client && window.location.pathname !== '/dashboard/login') {
            await navigateTo('/dashboard/login')
          }
        }

        throw error
      } finally {
        fetchUserPromise.value = null
        isLoading.value = false
      }
    })()

    fetchUserPromise.value = request
    return request
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
