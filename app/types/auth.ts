export type AuthNamespaceKey = 'app' | 'internal'

export interface AuthLoginPayload {
  email: string
  password: string
}

export interface AuthLoginData {
  access_token: string
  token_type: string
}

export interface AuthLoginResponse {
  message: string
  data: AuthLoginData
}

export interface AuthMeData {
  name: string
  email: string
  username: string
}

export interface AuthMeResponse {
  message: string
  data: AuthMeData
}

export interface AuthInternalMeData {
  role: number
  name: string
  email: string
  username: string
}

export interface AuthInternalMeResponse {
  message: string
  data: AuthInternalMeData
}
