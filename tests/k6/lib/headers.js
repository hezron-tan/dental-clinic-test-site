export function publicHeaders(apiKey) {
  return { apikey: apiKey };
}

export function authHeaders(apiKey, token) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${token}`
  };
}
