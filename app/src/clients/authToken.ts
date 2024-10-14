// src/auth/authToken.ts
let accessToken: string | null = null

export const setAccessToken = (token: string) => {
  accessToken = token
}

export const getAccessToken = (): string | null => {
  return accessToken
}

export const clearAccessToken = () => {
  accessToken = null
}
