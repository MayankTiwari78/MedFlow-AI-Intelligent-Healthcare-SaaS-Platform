import axios from 'axios'

let configured = false
let backendBaseUrl = ''
let setAdminToken = () => {}
let setDoctorToken = () => {}
let refreshPromise = null

const tokenKeyForRole = (role) => (role === 'doctor' ? 'dToken' : 'aToken')
const headerForRole = (role) => (role === 'doctor' ? 'dToken' : 'aToken')

const roleForUrl = (url = '') => {
  if (url.includes('/api/doctor/')) {
    return 'doctor'
  }

  if (url.includes('/api/admin/')) {
    return 'admin'
  }

  return null
}

const authEndpoint = (url = '') => url.includes('/api/v1/auth/')

const persistToken = (role, token) => {
  localStorage.setItem(tokenKeyForRole(role), token)

  if (role === 'doctor') {
    setDoctorToken(token)
  } else {
    setAdminToken(token)
  }
}

const clearTokens = () => {
  localStorage.removeItem('aToken')
  localStorage.removeItem('dToken')
  setAdminToken('')
  setDoctorToken('')
}

const refreshTokenForRole = async (expectedRole) => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        backendBaseUrl + '/api/v1/auth/refresh',
        {},
        { withCredentials: true, skipAuthRefresh: true }
      )
      .then(({ data }) => {
        const role = data?.data?.account?.role
        const token = data?.data?.accessToken || data?.data?.token || data?.token

        if (!token || role !== expectedRole) {
          throw new Error('Unable to refresh session')
        }

        persistToken(role, token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const configureAdminAuth = ({ backendUrl, setAToken, setDToken }) => {
  backendBaseUrl = backendUrl
  setAdminToken = setAToken || setAdminToken
  setDoctorToken = setDToken || setDoctorToken
  axios.defaults.withCredentials = true

  if (configured) {
    return
  }

  configured = true

  axios.interceptors.request.use((config) => {
    config.withCredentials = true

    const url = String(config.url || '')
    const role = roleForUrl(url)

    if (role) {
      const token = localStorage.getItem(tokenKeyForRole(role))

      if (token) {
        const header = headerForRole(role)
        config.headers = {
          ...config.headers,
          [header]: config.headers?.[header] || token
        }
      }
    }

    return config
  })

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config
      const url = String(original?.url || '')
      const role = roleForUrl(url)

      if (
        !original ||
        original.skipAuthRefresh ||
        original._retry ||
        authEndpoint(url) ||
        !role ||
        error.response?.status !== 401
      ) {
        return Promise.reject(error)
      }

      original._retry = true

      try {
        const token = await refreshTokenForRole(role)
        original.headers = {
          ...original.headers,
          [headerForRole(role)]: token
        }
        return axios(original)
      } catch {
        clearTokens()
        return Promise.reject(error)
      }
    }
  )
}

export const logoutAdminSession = async (backendUrl) => {
  try {
    await axios.post(
      backendUrl + '/api/v1/auth/logout',
      {},
      { withCredentials: true, skipAuthRefresh: true }
    )
  } finally {
    clearTokens()
  }
}
