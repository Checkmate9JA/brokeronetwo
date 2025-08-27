import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null, redirectTo = '/Auth' }) {
  const { user, userProfile, loading, supabaseError } = useAuth()

  console.log('ProtectedRoute state:', { user, userProfile, loading, requiredRole, redirectTo, supabaseError })

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700 text-lg">
        Loading...
      </div>
    )
  }

  // If there's a Supabase error, show error message
  if (supabaseError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700 text-lg">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Connection Error</div>
          <div className="text-sm">Unable to connect to the database. Please check your connection.</div>
        </div>
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
