/**
 * Get authenticated fetch headers with x-user-id.
 * Used by stores to authenticate API requests.
 */
export function getAuthHeaders(contentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = "application/json";
  try {
    const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
    const userId = authData?.state?.currentUser?.id;
    if (userId) headers["x-user-id"] = userId;
  } catch { /* ignore */ }
  return headers;
}

/**
 * Fetch with auth headers automatically included.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userId = (() => {
    try {
      const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
      return authData?.state?.currentUser?.id || "";
    } catch { return ""; }
  })();

  const headers = new Headers(options.headers);
  if (userId) headers.set("x-user-id", userId);

  return fetch(url, { ...options, headers });
}
