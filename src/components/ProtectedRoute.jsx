import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null, redirectTo = '/Auth' }) {
  const { user, userProfile, loading } = useAuth()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700 text-lg">
        Loading...
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  // If role is required, check user role
  if (requiredRole && userProfile) {
    if (requiredRole === 'admin' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      return <Navigate to="/Auth" replace />
    }
    if (requiredRole === 'super_admin' && userProfile.role !== 'super_admin') {
      return <Navigate to="/Auth" replace />
    }
  }

  // If all checks pass, render children
  return children
}
