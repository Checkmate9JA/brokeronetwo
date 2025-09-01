import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 🚀🚀🚀 COMPLETE COMPONENT ISOLATION: Function defined OUTSIDE component - NEVER recreated
const createProfileFetcher = (setUserProfile, setProfileCacheTime, setLoading, setProfileFetchCount) => {
  let hasProfile = false // Local flag that never changes
  let globalBlock = false // 🚫🚫🚫🚫🚫🚫 GLOBAL BLOCK FLAG
  let isInitialized = false // 🚫🚫🚫🚫🚫🚫 INITIALIZATION FLAG
  
  return async (email, forceRefresh = false) => {
    // 🚫🚫🚫🚫🚫🚫🚫🚫🚫 INITIALIZATION BLOCK: Once initialized, NEVER fetch again
    if (isInitialized && !forceRefresh) {
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫 INITIALIZATION BLOCK: Already initialized, NO FETCHES EVER')
      return
    }
    
    if (!email) {
      console.log('fetchUserProfile: No email provided, setting profile to null')
      setUserProfile(null)
      hasProfile = false
      globalBlock = false
      isInitialized = false
      return
    }
    
    // 🚫🚫🚫🚫🚫🚫 GLOBAL BLOCK: If globally blocked, NO FETCHES EVER (unless force refresh)
    if (globalBlock && !forceRefresh) {
      console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫 GLOBAL BLOCK: Profile fetch globally blocked forever')
      return
    }
    
    // 🚫🚫🚫🚫 ULTIMATE BLOCK: Once we have a profile, NEVER fetch again (unless force refresh)
    if (!forceRefresh && hasProfile) {
      console.log('🚫🚫🚫🚫🚫🚫 ULTIMATE BLOCK: Profile exists, NO FETCHES EVER ALLOWED')
      globalBlock = true
      isInitialized = true // 🚫🚫🚫🚫🚫🚫 SET INITIALIZATION FLAG FOREVER
      return
    }
    
    if (forceRefresh) {
      console.log('🔄 fetchUserProfile: Force refresh requested')
      hasProfile = false
      globalBlock = false
      isInitialized = false // Reset initialization for force refresh
    } else {
      console.log('🆕 fetchUserProfile: No profile exists, allowing fetch')
    }
    
    // Set loading while fetching profile
    setLoading(true)
    setProfileFetchCount(prev => prev + 1)
    
    try {
      console.log('fetchUserProfile: Fetching profile for email:', email)
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000) // 5 second timeout
      })
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])
      
      if (error) {
        console.error('Error fetching user profile:', error)
        console.log('fetchUserProfile: Setting profile to null due to error')
        setUserProfile(null)
        hasProfile = false
        globalBlock = false
        isInitialized = false
        return
      }
      
      if (data) {
        console.log('fetchUserProfile: Successfully fetched profile:', data)
        console.log('🔄 About to call setUserProfile with:', data)
        setUserProfile(data)
        console.log('✅ setUserProfile called')
        setProfileCacheTime(Date.now())
        hasProfile = true
        // Only set global block if this is NOT a force refresh
        if (!forceRefresh) {
          globalBlock = true
          isInitialized = true // 🚫🚫🚫🚫🚫🚫 SET INITIALIZATION FLAG FOREVER
        } else {
          console.log('🔄 Force refresh completed - keeping profile updatable')
        }
      } else {
        console.log('fetchUserProfile: No profile data returned, setting to null')
        setUserProfile(null)
        setProfileCacheTime(null)
        hasProfile = false
        globalBlock = false
        isInitialized = false
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      console.log('fetchUserProfile: Setting profile to null due to exception')
      setUserProfile(null)
      hasProfile = false
      globalBlock = false
      isInitialized = false
    } finally {
      setLoading(false)
      setProfileFetchCount(0)
    }
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileCacheTime, setProfileCacheTime] = useState(null)
  const [profileFetchCount, setProfileFetchCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState(false)
  const [forceRedirect, setForceRedirect] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false) // Emergency mode to stop loops

  // 🚀 ULTIMATE SOLUTION: Create function once, never recreate
  const fetchUserProfile = createProfileFetcher(setUserProfile, setProfileCacheTime, setLoading, setProfileFetchCount)

  // REMOVED: Page visibility logic was not working as expected
  // Profile fetches are now controlled by aggressive caching strategy

  useEffect(() => {
    // Only run this effect once when component mounts
    let isMounted = true;
    
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
      if (!isMounted) return;
      
      console.log('Getting initial session...')
      
      // Force clear mock users first
      await forceClearMockUsers()
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.log('Session timeout - setting loading to false')
          setLoading(false)
        }
      }, 5000) // 5 second timeout
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return;
        
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
            console.log('Initial session has user, checking if profile needed...')
            // AGGRESSIVE: Only fetch if absolutely no profile exists
            if (!userProfile) {
              try {
                await fetchUserProfile(session.user.email)
                console.log('Profile fetched on initial session')
              } catch (error) {
                console.error('Error fetching profile on initial session:', error)
              }
            } else {
              console.log('🚫 Profile already exists, BLOCKING fetch on initial session')
            }
          } else {
            console.log('No user in initial session')
            setUserProfile(null)
          }
        }
        
        console.log('Final user state:', { user: session?.user, userProfile: userProfile })
        // Loading will be managed by fetchUserProfile
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
          setProfileCacheTime(null)
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
          setProfileCacheTime(null)
          setLoading(false)
          return
        }
        
        // Only proceed if we have a valid, non-mock user
        if (session?.user && !session.user.email.includes('@localhost')) {
          console.log('Setting user and checking profile...')
          setUser(session.user)
          
          // AGGRESSIVE: Only fetch if absolutely no profile exists
          if (!userProfile) {
            try {
              await fetchUserProfile(session.user.email)
              console.log('Profile fetched on auth state change')
            } catch (error) {
              console.error('Error fetching profile on auth state change:', error)
            }
          } else {
            console.log('🚫 Profile already exists, BLOCKING fetch on auth state change')
          }
        } else {
          console.log('No valid user, clearing state')
          setUser(null)
          setUserProfile(null)
          setProfileCacheTime(null)
          setLoading(false)
        }
        
        console.log('Auth state change completed')
      }
    )

    return () => {
      isMounted = false;
      subscription.unsubscribe()
      // Clean up any remaining state on unmount
      setUser(null)
      setUserProfile(null)
      setProfileCacheTime(null)
      setLoading(false)
      setForceRedirect(false)
    }
  }, [])

  // Redirect to appropriate dashboard after successful login
  useEffect(() => {
    if (!loading && user && userProfile && !forceRedirect && !emergencyMode) {
      console.log('User and profile loaded, checking for redirect...')
      
      // Only redirect if we're on an auth page
      const currentPath = window.location.pathname
      if (currentPath === '/Auth' || currentPath === '/AdminAuth' || currentPath === '/SuperAdminAuth') {
        console.log('Redirecting from auth page to appropriate dashboard...')
        
        // Redirect based on user role
        if (userProfile.role === 'super_admin') {
          window.location.href = '/SuperAdminDashboard'
        } else if (userProfile.role === 'admin') {
          window.location.href = '/AdminDashboard'
        } else {
          window.location.href = '/Dashboard'
        }
      }
    }
  }, [loading, user, forceRedirect, emergencyMode])

  // Force redirect to Auth if no valid user after loading (with safety check)
  useEffect(() => {
    if (!loading && !user && !forceRedirect && !emergencyMode) {
      console.log('No valid user found after loading, forcing redirect to Auth')
      setForceRedirect(true)
      // Clear any remaining tokens
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      // Only redirect if we're not already on an auth page
      if (window.location.pathname !== '/Auth' && window.location.pathname !== '/AdminAuth' && window.location.pathname !== '/SuperAdminAuth') {
        window.location.href = '/Auth'
      }
    }
  }, [loading, user, emergencyMode]) // Added emergencyMode to prevent redirects

  // Remove the duplicate redirect logic to prevent infinite loops

  // Safety mechanism: reset forceRedirect after a delay to prevent getting stuck
  useEffect(() => {
    if (forceRedirect) {
      const resetTimeout = setTimeout(() => {
        console.log('Resetting forceRedirect to prevent getting stuck')
        setForceRedirect(false)
      }, 5000) // Reset after 5 seconds
      
      return () => clearTimeout(resetTimeout)
    }
  }, [forceRedirect])

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
      
      // User authenticated successfully, now check if profile needed
      if (data.user) {
        console.log('User authenticated successfully, checking profile...')
        
        // AGGRESSIVE: Only fetch if absolutely no profile exists
        if (!userProfile) {
          try {
            await fetchUserProfile(data.user.email)
            console.log('Profile fetched after login')
          } catch (profileError) {
            console.warn('Profile fetch failed after login, but continuing:', profileError)
            // Don't fail the login if profile fetch fails
          }
        } else {
          console.log('🚫 Profile already exists, BLOCKING fetch after login')
        }
        
        return { data, error: null }
      }
      
      console.log('Sign in successful for:', email)
      return { data, error: null }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { data: null, error }
    }
  }

  const signUp = async (email, password, fullName, preferredCurrency = 'USD') => {
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
          
          // Try to create profile with better error handling
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert([
              {
                email: email,
                full_name: fullName,
                role: 'user',
                preferred_currency: preferredCurrency
              }
            ])
            .select()
          
          if (profileError) {
            console.error('Error creating user profile:', profileError)
            
            // Check if it's an RLS policy issue
            if (profileError.code === '42501') {
              throw new Error('Access denied. Please contact support.')
            }
            
            // Check if it's a duplicate key issue
            if (profileError.code === '23505') {
              throw new Error('User already exists with this email.')
            }
            
            // Generic database error
            throw new Error(`Database error: ${profileError.message}`)
          } else {
            console.log('User profile created successfully:', profileData)
          }
        } catch (profileError) {
          console.error('Exception creating user profile:', profileError)
          
          // If profile creation fails, we should clean up the auth user
          try {
            console.log('Cleaning up auth user due to profile creation failure...')
            // Note: We can't delete the auth user from client side, but we can sign them out
            await supabase.auth.signOut()
          } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError)
          }
          
          throw profileError
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
      setProfileCacheTime(null)
      
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

  // Debug logging for profile state and cache
  useEffect(() => {
    const cacheAge = profileCacheTime ? Date.now() - profileCacheTime : null
    const cacheAgeMinutes = cacheAge ? Math.round(cacheAge / 60000) : null
    
    console.log('🔍 Profile State Changed:', {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile: userProfile ? { id: userProfile.id, email: userProfile.email, role: userProfile.role } : null,
      loading,
      hasProfile: !!userProfile,
      cacheAge: cacheAgeMinutes ? `${cacheAgeMinutes} minutes` : 'No cache',
      cacheValid: cacheAge ? cacheAge < 10 * 60 * 1000 : false,
      profileFetchCount
    })
  }, [user, loading, profileCacheTime, profileFetchCount])

  const value = {
    user,
    userProfile,
    loading,
    supabaseError,
    forceRedirect,
    emergencyMode,
    setEmergencyMode, // Allow components to trigger emergency mode
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
    refreshProfile: async () => {
      console.log('🔄 refreshProfile called for user:', user?.email);
      if (user?.email) {
        try {
          // Direct database fetch to bypass the complex caching logic
          console.log('🔄 Fetching fresh profile from database...');
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
          
          if (error) {
            console.error('❌ Error fetching fresh profile:', error);
            return null;
          }
          
          if (data) {
            console.log('✅ Fresh profile fetched:', data);
            console.log('🔄 Updating userProfile state...');
            setUserProfile(data);
            setProfileCacheTime(Date.now());
            console.log('✅ userProfile state updated');
            return data;
          }
        } catch (error) {
          console.error('❌ Exception in refreshProfile:', error);
          return null;
        }
      }
      console.log('❌ refreshProfile: No user email available');
      return null;
    },
    clearProfileCache: () => {
      setProfileCacheTime(null)
      console.log('🧹 Profile cache cleared manually')
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
