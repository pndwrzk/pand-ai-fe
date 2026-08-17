export const useApi = () => {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  return $fetch.create({
    baseURL: `${String(runtimeConfig.public.apiBaseUrl).replace(/\/$/, '')}/api/v1`,
    headers: {
      Accept: 'application/json'
    },
    onRequest: ({ options }) => {
      const isInternalRequest = route.path.startsWith('/dashboard')
      const token = isInternalRequest
        ? useCookie('internal_access_token').value
        : useCookie('app_access_token').value

      const headers = new Headers(options.headers)

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
        options.headers = headers
      }
    },
    async onResponseError({ response, request }) {
      if (response.status !== 401) {
        return
      }

      const currentPath = route.path
      const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/') || currentPath.startsWith('/dashboard/login')

      if (isLoginPage) {
        return
      }

      const isInternalRoute = currentPath.startsWith('/dashboard')

      if (isInternalRoute) {
        useCookie('internal_access_token').value = null
        useCookie('internal_token_type').value = null
        await navigateTo('/dashboard/login')
        return
      }

      useCookie('app_access_token').value = null
      useCookie('app_token_type').value = null
      await navigateTo('/login')
    }
  })
}
