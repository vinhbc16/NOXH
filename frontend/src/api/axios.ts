import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import type { ApiResponse, AuthResponse } from '@/types'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiResponse<AuthResponse>>('/auth/refresh')
      .then((res) => {
        const auth = res.data.result
        if (!auth?.accessToken) {
          throw new Error('Missing access token in refresh response')
        }
        useAuthStore.getState().setAuth(auth.accessToken, auth)
        return auth.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const ensureFreshAccessToken = async () => refreshAccessToken()

const shouldSkipAuthRedirect = (url?: string) =>
  url === '/auth/login' || url === '/auth/register' || url === '/auth/forgot-password' ||
  url === '/auth/verify-otp' || url === '/auth/reset-password'

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipAuthRedirect(originalRequest.url)
    ) {
      originalRequest._retry = true

      try {
        const accessToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    } else if (error.response?.status === 401 && !shouldSkipAuthRedirect(originalRequest?.url)) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
