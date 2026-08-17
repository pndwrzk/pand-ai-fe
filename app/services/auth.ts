import type { AuthLoginPayload, AuthLoginResponse, AuthNamespaceKey } from "~/types/auth";

const authCookieMap = {
  app: {
    accessToken: "app_access_token",
    tokenType: "app_token_type",
  },
  internal: {
    accessToken: "internal_access_token",
    tokenType: "internal_token_type",
  },
} as const;

export const appLogin = async (
  payload: AuthLoginPayload,
): Promise<AuthLoginResponse> => {
  const api = useApi();

  return await api<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
};

export const internalLogin = async (
  payload: AuthLoginPayload,
): Promise<AuthLoginResponse> => {
  const api = useApi();

  return await api<AuthLoginResponse>("/auth/internal/login", {
    method: "POST",
    body: payload,
  });
};

export const setAuthToken = (
  token: string,
  tokenType = "Bearer",
  namespace: AuthNamespaceKey = "app",
) => {
  const otherNamespace: AuthNamespaceKey = namespace === "app" ? "internal" : "app";

  clearAuthToken(otherNamespace);

  const { accessToken: accessTokenKey, tokenType: tokenTypeKey } = authCookieMap[namespace];

  const accessTokenCookie = useCookie(accessTokenKey, {
    path: "/",
    sameSite: "lax",
  });

  const tokenTypeCookie = useCookie(tokenTypeKey, {
    path: "/",
    sameSite: "lax",
  });

  accessTokenCookie.value = token;
  tokenTypeCookie.value = tokenType;
};

export const clearAuthToken = (namespace: AuthNamespaceKey = "app") => {
  const { accessToken: accessTokenKey, tokenType: tokenTypeKey } = authCookieMap[namespace];

  const accessTokenCookie = useCookie(accessTokenKey, {
    path: "/",
    sameSite: "lax",
  });

  const tokenTypeCookie = useCookie(tokenTypeKey, {
    path: "/",
    sameSite: "lax",
  });

  accessTokenCookie.value = null;
  tokenTypeCookie.value = null;
};
