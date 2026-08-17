import type { AuthInternalMeData, AuthInternalMeResponse, AuthLoginPayload, AuthLoginResponse, AuthMeData, AuthMeResponse, AuthNamespaceKey } from "~/types/auth";

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

export const fetchMe = async (): Promise<AuthMeData> => {
  const api = useApi();

  const response = await api<AuthMeResponse>("/auth/me");

  return response.data;
};

export const fetchInternalMe = async (): Promise<AuthInternalMeData> => {
  const api = useApi();

  const response = await api<AuthInternalMeResponse>("/auth/internal/me");

  return response.data;
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
