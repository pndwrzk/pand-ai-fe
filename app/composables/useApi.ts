import { clearAuthToken } from "~/services/auth"

export const useApi = () => {
  const runtimeConfig = useRuntimeConfig()
  const { $router } = useNuxtApp()

  return $fetch.create({
    baseURL: `${String(runtimeConfig.public.apiBaseUrl).replace(/\/$/, '')}/api/v1`,
    headers: {
      Accept: 'application/json'
    },
    onRequest: ({ options }) => {
      const currentPath = $router.currentRoute.value.path
      const isInternalRequest = currentPath.startsWith('/dashboard')
      const token = isInternalRequest
        ? useCookie('internal_access_token').value
        : useCookie('app_access_token').value

      const headers = new Headers(options.headers)

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
        options.headers = headers
      }
    },
    async onResponseError({ response }) {
      if (response.status !== 401) {
        return
      }

      const currentPath = $router.currentRoute.value.path
      const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/') || currentPath.startsWith('/dashboard/login')

      if (isLoginPage) {
        clearAuthToken('app')
        clearAuthToken('internal')
        const { clearUser } = useAuthUser()
        clearUser()
        return
      }

      const isInternalRoute = currentPath.startsWith('/dashboard')

      clearAuthToken(isInternalRoute ? 'internal' : 'app')
      const { clearUser } = useAuthUser()
      clearUser()

      await navigateTo(isInternalRoute ? '/dashboard/login' : '/login')
    }
  })
}
