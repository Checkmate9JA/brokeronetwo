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
      console.log('fetchUserProfile: No email provided, setting profile to null')
      setUserProfile(null)
      return
    }
    
    try {
      console.log('fetchUserProfile: Fetching profile for email:', email)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // 10 second timeout
      })
      
      // First try to get profile using the secure function
      const profilePromise = supabase
        .rpc('get_user_profile', { user_email: email })

      const { data, error } = await Promise.race([profilePromise, timeoutPromise])

      if (error) {
        console.error('Error fetching user profile via function:', error)
        
        // Fallback: try direct table access
        console.log('fetchUserProfile: Trying fallback direct table access')
        const fallbackPromise = supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        
        const fallbackResult = await Promise.race([fallbackPromise, timeoutPromise])
        
        if (fallbackResult.error) {
          console.error('Fallback profile fetch also failed:', fallbackResult.error)
          console.log('fetchUserProfile: Setting profile to null due to error')
          setUserProfile(null)
          return
        }
        
        console.log('fetchUserProfile: Successfully fetched profile via fallback:', fallbackResult.data)
        setUserProfile(fallbackResult.data)
        return
      }

      if (data && data.length > 0) {
        console.log('fetchUserProfile: Successfully fetched profile via function:', data[0])
        setUserProfile(data[0])
      } else {
        console.log('fetchUserProfile: No profile data returned, setting to null')
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      console.log('fetchUserProfile: Setting profile to null due to exception')
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
            console.log('Initial session has user, fetching profile...')
            try {
              await fetchUserProfile(session.user.email)
              console.log('Initial profile fetch completed')
            } catch (error) {
              console.error('Error in initial profile fetch:', error)
            }
          } else {
            console.log('No user in initial session')
            setUserProfile(null)
          }
        }
        
        console.log('Final user state:', { user: session?.user, userProfile: userProfile })
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
          console.log('Setting user and fetching profile...')
          setUser(session.user)
          try {
            await fetchUserProfile(session.user.email)
            console.log('Profile fetch completed, setting loading to false')
          } catch (error) {
            console.error('Error in profile fetch, but continuing:', error)
          }
        } else {
          console.log('No valid user, clearing state')
          setUser(null)
          setUserProfile(null)
        }
        
        console.log('Auth state change completed, setting loading to false')
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

  // Safety timeout: if loading takes too long, force resolve it
  useEffect(() => {
    if (loading) {
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout: Loading taking too long, forcing loading to false')
        setLoading(false)
      }, 15000) // 15 second safety timeout

      return () => clearTimeout(safetyTimeout)
    }
  }, [loading])

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
      console.log('Attempting sign up for:', email, 'with name:', fullName)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        throw error
      }
      
      console.log('Sign up successful for:', email)
      
      // If signup is successful, manually create the user profile
      if (data.user) {
        try {
          console.log('Creating user profile for:', email)
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                email: email,
                full_name: fullName,
                role: 'user'
              }
            ])
          
          if (profileError) {
            console.error('Error creating user profile:', profileError)
            // Don't throw here, as the auth user was created successfully
          } else {
            console.log('User profile created successfully')
          }
        } catch (profileError) {
          console.error('Exception creating user profile:', profileError)
        }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign up failed:', error)
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
