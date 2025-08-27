import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState(false)
  const [forceRedirect, setForceRedirect] = useState(false)

  const fetchUserProfile = useCallback(async (email) => {
    if (!email) {
      setUserProfile(null)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
    }
  }, [])

  useEffect(() => {
    // Force clear any existing mock users first
    const forceClearMockUsers = async () => {
      try {
        // Check if there's any existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email?.includes('@localhost')) {
          console.log('Force clearing mock user session')
          await supabase.auth.signOut()
          // Clear any stored tokens
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        }
      } catch (error) {
        console.error('Error clearing mock users:', error)
      }
    }

    // Get initial session
    const getSession = async () => {
      console.log('Getting initial session...')
      
      // Force clear mock users first
      await forceClearMockUsers()
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Session timeout - setting loading to false')
        setLoading(false)
      }, 5000) // 5 second timeout
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session result:', session)
        console.log('Session user:', session?.user)
        console.log('Session user email:', session?.user?.email)
        
        // Double-check: ensure we don't have any mock users
        if (session?.user?.email?.includes('@localhost')) {
          console.log('Mock user still detected, forcing logout')
          await supabase.auth.signOut()
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
          setUser(null)
          setUserProfile(null)
        } else {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserProfile(session.user.email)
          } else {
            setUserProfile(null)
          }
        }
        
        console.log('Final user state:', { user: session?.user, userProfile: null })
        console.log('Setting loading to false')
        setLoading(false)
      } catch (error) {
        console.error('Error getting session:', error)
        setSupabaseError(true)
        setLoading(false)
      } finally {
        clearTimeout(timeoutId)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state')
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }
        
        // Aggressively check for and clear any mock users
        if (session?.user?.email?.includes('@localhost')) {
          console.log('Mock user detected in auth change, forcing logout')
          await supabase.auth.signOut()
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }
        
        // Only proceed if we have a valid, non-mock user
        if (session?.user && !session.user.email.includes('@localhost')) {
          setUser(session.user)
          await fetchUserProfile(session.user.email)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      // Clean up any remaining state on unmount
      setUser(null)
      setUserProfile(null)
      setLoading(false)
      setForceRedirect(false)
    }
  }, [fetchUserProfile])

  // Force redirect to Auth if no valid user after loading
  useEffect(() => {
    if (!loading && !user && !forceRedirect) {
      console.log('No valid user found after loading, forcing redirect to Auth')
      setForceRedirect(true)
      // Clear any remaining tokens
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      // Force redirect
      window.location.href = '/Auth'
    }
  }, [loading, user, forceRedirect])

  // Additional safety check: if we're on any page other than Auth and no user, redirect
  useEffect(() => {
    if (!loading && !user && window.location.pathname !== '/Auth' && window.location.pathname !== '/AdminAuth' && window.location.pathname !== '/SuperAdminAuth') {
      console.log('User not authenticated and not on auth page, forcing redirect to Auth')
      setForceRedirect(true)
      window.location.href = '/Auth'
    }
  }, [loading, user])

  const signIn = async (email, password) => {
    try {
      console.log('Attempting sign in for:', email)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign in timeout')), 10000) // 10 second timeout
      })
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful for:', email)
      return { data, error: null }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { data: null, error }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')
      console.log('Current user state before logout:', { user, userProfile })
      
      // Clear local state first
      setUser(null)
      setUserProfile(null)
      
      // Aggressively clear all stored data
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
      localStorage.removeItem('supabase.auth.expiresAt')
      sessionStorage.clear()
      
      // Clear any cookies that might persist
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Then clear Supabase session
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error)
        // Even if Supabase fails, we've cleared local state
      }
      
      console.log('Sign out successful - all state cleared')
      
      // Force a page reload to ensure clean state
      window.location.href = '/Auth'
      
      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      // Even on error, clear state and redirect
      setUser(null)
      setUserProfile(null)
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      window.location.href = '/Auth'
      return { success: true }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    supabaseError,
    forceRedirect,
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
