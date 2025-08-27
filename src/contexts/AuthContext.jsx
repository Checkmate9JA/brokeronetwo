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
    // Get initial session
    const getSession = async () => {
      console.log('Getting initial session...')
      
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
        
        // Ensure we don't have any mock users
        if (session?.user?.email?.includes('@localhost')) {
          console.log('Mock user detected, clearing session')
          await supabase.auth.signOut()
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
        
        // Ensure we don't have any mock users
        if (session?.user?.email?.includes('@localhost')) {
          console.log('Mock user detected in auth change, clearing session')
          await supabase.auth.signOut()
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
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

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
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state
      setUser(null)
      setUserProfile(null)
      
      console.log('Local state cleared, user:', user, 'userProfile:', userProfile)
      console.log('Sign out successful')
      
      // Return success status so component can handle redirect
      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      return { success: false, error }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    supabaseError,
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
