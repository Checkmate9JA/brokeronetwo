import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.email)
        } else {
          setUserProfile(null)
        }
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
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.email)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

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

  const signIn = async (email, password) => {
    try {
      // Use real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
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
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
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
