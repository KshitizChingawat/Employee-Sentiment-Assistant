import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('sa_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sa_token')
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('sa_token'); localStorage.removeItem('sa_user') })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res  = await authAPI.login({ email, password })
    const data = res.data
    localStorage.setItem('sa_token', data.access_token)
    localStorage.setItem('sa_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const res = await authAPI.register(payload)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_user')
    setUser(null)
  }

  const isHROrAdmin = user?.role === 'hr' || user?.role === 'admin'
  const isAdmin     = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isHROrAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
