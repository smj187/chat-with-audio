import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios"

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8"
}

export type AxiosConfig = {
  headers: {
    Accept: string
    "Content-Type": string
    Authorization: string
  }
}

class HttpClient {
  private static instance: AxiosInstance

  private constructor() {}

  public static getInstance(): AxiosInstance {
    if (!HttpClient.instance) {
      HttpClient.instance = axios.create({
        baseURL: import.meta.env.VITE_BASE_URL_APP_SERVICE_API,
        headers,
        timeout: 10000
      })

      // Initial interceptor (if any)
      HttpClient.instance.interceptors.request.use(
        HttpClient.injectToken,
        error => Promise.reject(error)
      )
    }
    return HttpClient.instance
  }

  private static async injectToken(
    config: InternalAxiosRequestConfig<AxiosConfig>
  ): Promise<InternalAxiosRequestConfig<AxiosConfig>> {
    return config
  }
}

export const client = HttpClient.getInstance()
