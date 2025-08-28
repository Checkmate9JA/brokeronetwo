import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null, redirectTo = '/Auth' }) {
  const { user, userProfile, loading, supabaseError, forceRedirect } = useAuth()

  console.log('ProtectedRoute state:', { 
    user: user ? { id: user.id, email: user.email } : null, 
    userProfile: userProfile ? { id: userProfile.id, role: userProfile.role } : null, 
    loading, 
    requiredRole, 
    redirectTo, 
    supabaseError,
    forceRedirect
  })

  // If force redirect is active, redirect immediately
  if (forceRedirect) {
    console.log('ProtectedRoute: Force redirect active, redirecting to:', redirectTo)
    return <Navigate to={redirectTo} replace />
  }

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
    console.log('ProtectedRoute: No user, redirecting to:', redirectTo)
    return <Navigate to={redirectTo} replace />
  }

  // If role is required, check user role (but allow access even if profile is still loading)
  if (requiredRole && userProfile) {
    console.log('ProtectedRoute: Checking role requirements. Required:', requiredRole, 'User role:', userProfile.role)
    
    if (requiredRole === 'admin') {
      // Admin routes: only admin and super_admin can access
      if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
        console.log('ProtectedRoute: User role insufficient for admin access')
        return <Navigate to="/Auth" replace />
      }
    }
    
    if (requiredRole === 'super_admin') {
      // Super admin routes: ONLY super_admin can access
      if (userProfile.role !== 'super_admin') {
        console.log('ProtectedRoute: User role insufficient for super admin access. User role:', userProfile.role)
        return <Navigate to="/SuperAdminAuth" replace />
      }
    }
  }

  // If we have a user but no profile yet, still allow access (profile will load in background)
  if (user && !userProfile) {
    console.log('ProtectedRoute: User authenticated but profile not loaded yet, allowing access')
  }

  // If all checks pass, render children
  console.log('ProtectedRoute: All checks passed, rendering children')
  return children
}
