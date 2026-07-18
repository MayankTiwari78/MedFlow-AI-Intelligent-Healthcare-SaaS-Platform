import axios from 'axios'

let configured = false
let backendBaseUrl = ''
let setPatientToken = () => {}
let refreshPromise = null

const patientTokenKey = 'token'
const inBrowser = () => typeof window !== 'undefined'

const authEndpoint = (url = '') => url.includes('/api/v1/auth/')

const patientEndpoint = (url = '') => url.includes('/api/user/') && !url.endsWith('/login') && !url.endsWith('/register')

const persistToken = (token) => {
  if (inBrowser()) {
    window.localStorage.setItem(patientTokenKey, token)
  }
  setPatientToken(token)
}

const clearToken = () => {
  if (inBrowser()) {
    window.localStorage.removeItem(patientTokenKey)
  }
  setPatientToken('')
}

const refreshPatientToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        backendBaseUrl + '/api/v1/auth/refresh',
        {},
        { withCredentials: true, skipAuthRefresh: true }
      )
      .then(({ data }) => {
        const nextToken = data?.data?.accessToken || data?.data?.token || data?.token

        if (!nextToken) {
          throw new Error('Unable to refresh session')
        }

        persistToken(nextToken)
        return nextToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const configurePatientAuth = ({ backendUrl, setToken }) => {
  backendBaseUrl = backendUrl
  setPatientToken = setToken
  axios.defaults.withCredentials = true

  if (configured) {
    return
  }

  configured = true

  axios.interceptors.request.use((config) => {
    config.withCredentials = true

    const url = String(config.url || '')
    const token = inBrowser() ? window.localStorage.getItem(patientTokenKey) : null

    if (token && patientEndpoint(url)) {
      config.headers = {
        ...config.headers,
        token: config.headers?.token || token
      }
    }

    return config
  })

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config
      const url = String(original?.url || '')

      if (
        !original ||
        original.skipAuthRefresh ||
        original._retry ||
        authEndpoint(url) ||
        !patientEndpoint(url) ||
        error.response?.status !== 401
      ) {
        return Promise.reject(error)
      }

      original._retry = true

      try {
        const token = await refreshPatientToken()
        original.headers = {
          ...original.headers,
          token
        }
        return axios(original)
      } catch {
        clearToken()
        return Promise.reject(error)
      }
    }
  )
}

export const logoutPatientSession = async (backendUrl) => {
  try {
    await axios.post(
      backendUrl + '/api/v1/auth/logout',
      {},
      { withCredentials: true, skipAuthRefresh: true }
    )
  } finally {
    clearToken()
  }
}
