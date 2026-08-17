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
