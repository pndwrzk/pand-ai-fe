import { clearAuthToken } from '~/services/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const appToken = useCookie('app_access_token').value
  const internalToken = useCookie('internal_access_token').value

  if (to.path === '/login') {
    if (appToken) {
      return navigateTo('/')
    }

    return
  }

  if (to.path === '/dashboard/login') {
    if (internalToken) {
      return navigateTo('/dashboard')
    }

    return
  }

  if (to.path === '/') {
    if (!appToken) {
      return navigateTo('/login')
    }

    return
  }

  if (to.path.startsWith('/dashboard')) {
    if (!internalToken) {
      return navigateTo('/dashboard/login')
    }

    const { user, isSuperAdmin, fetchUser, clearUser, isLoading } = useAuthUser()

    if (!user.value && !isLoading.value) {
      try {
        await fetchUser()
      } catch {
        clearAuthToken('internal')
        clearAuthToken('app')
        clearUser()
        return navigateTo('/dashboard/login')
      }
    }

    if (to.path.startsWith('/dashboard/users') && !isSuperAdmin.value) {
      return navigateTo('/dashboard')
    }
  }
})
