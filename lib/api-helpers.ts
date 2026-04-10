/**
 * Get standard fetch headers for API requests.
 * Auth is handled automatically via httpOnly session cookie.
 */
export function getAuthHeaders(contentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = "application/json";
  return headers;
}

/**
 * Fetch wrapper for API requests.
 * Auth is handled automatically via httpOnly session cookie.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options });
}
