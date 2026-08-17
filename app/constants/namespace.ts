/**
 * Application Namespace Constants
 */

export const NAMESPACE = {
  APP: 0,
  INTERNAL: 1
} as const

export type AppNamespace = typeof NAMESPACE.APP | typeof NAMESPACE.INTERNAL

export const NAMESPACE_KEYS = {
  APP: 'app',
  INTERNAL: 'internal'
} as const

export type AppNamespaceKey = typeof NAMESPACE_KEYS.APP | typeof NAMESPACE_KEYS.INTERNAL


export const getNamespaceKey = (namespace: AppNamespace): AppNamespaceKey => {
  return namespace === NAMESPACE.APP ? NAMESPACE_KEYS.APP : NAMESPACE_KEYS.INTERNAL
}


export const getNamespace = (key: AppNamespaceKey): AppNamespace => {
  return key === NAMESPACE_KEYS.APP ? NAMESPACE.APP : NAMESPACE.INTERNAL
}
