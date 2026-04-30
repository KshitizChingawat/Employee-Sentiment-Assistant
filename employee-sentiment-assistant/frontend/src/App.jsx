import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import SubmitFeedback from './pages/SubmitFeedback'
import Analytics      from './pages/Analytics'
import FeedbackList   from './pages/FeedbackList'
import Layout         from './components/Layout'

function ProtectedRoute({ children, hrOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (hrOnly && user.role === 'employee') return <Navigate to="/feedback" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/"          element={
          <ProtectedRoute hrOnly>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute hrOnly>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/feedback"      element={<SubmitFeedback />} />
        <Route path="/feedback/list" element={<FeedbackList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style:   { background: '#1E2130', color: '#E8EBF0', border: '1px solid #2E3347' },
            success: { iconTheme: { primary: '#10B981', secondary: '#1E2130' } },
            error:   { iconTheme: { primary: '#F43F5E', secondary: '#1E2130' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
