import React, { useState, useEffect } from 'react'
import { supabase, testSupabaseConnection, testSupabaseAuth } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('testing')
  const [authStatus, setAuthStatus] = useState('testing')
  const [connectionDetails, setConnectionDetails] = useState(null)
  const [authDetails, setAuthDetails] = useState(null)
  const [lastTest, setLastTest] = useState(null)

  const runConnectionTest = async () => {
    setConnectionStatus('testing')
    setLastTest(new Date().toLocaleTimeString())
    
    try {
      const result = await testSupabaseConnection()
      setConnectionStatus(result.success ? 'success' : 'error')
      setConnectionDetails(result)
    } catch (error) {
      setConnectionStatus('error')
      setConnectionDetails({ success: false, error: error.message })
    }
  }

  const runAuthTest = async () => {
    setAuthStatus('testing')
    
    try {
      const result = await testSupabaseAuth()
      setAuthStatus(result.success ? 'success' : 'error')
      setAuthDetails(result)
    } catch (error) {
      setAuthStatus('error')
      setAuthDetails({ success: false, error: error.message })
    }
  }

  const runAllTests = async () => {
    await Promise.all([runConnectionTest(), runAuthTest()])
  }

  useEffect(() => {
    runAllTests()
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">✅ Connected</Badge>
      case 'error':
        return <Badge className="bg-red-500">❌ Failed</Badge>
      case 'testing':
        return <Badge className="bg-yellow-500">🔄 Testing...</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'testing':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔌 Supabase Connection Test
            {lastTest && (
              <span className="text-sm text-gray-500 font-normal">
                Last tested: {lastTest}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Database Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span>Status:</span>
                  {getStatusBadge(connectionStatus)}
                </div>
                {connectionDetails && (
                  <div className="text-sm">
                    {connectionDetails.success ? (
                      <p className="text-green-600">✅ Database connection successful</p>
                    ) : (
                      <div>
                        <p className="text-red-600">❌ Connection failed</p>
                        <p className="text-red-500 text-xs mt-1">
                          Error: {connectionDetails.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Authentication System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span>Status:</span>
                  {getStatusBadge(authStatus)}
                </div>
                {authDetails && (
                  <div className="text-sm">
                    {authDetails.success ? (
                      <p className="text-green-600">✅ Auth system accessible</p>
                    ) : (
                      <div>
                        <p className="text-red-600">❌ Auth system failed</p>
                        <p className="text-red-500 text-xs mt-1">
                          Error: {authDetails.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>URL:</strong>
                  <p className="font-mono text-xs break-all">
                    {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
                  </p>
                </div>
                <div>
                  <strong>Anon Key:</strong>
                  <p className="font-mono text-xs break-all">
                    {import.meta.env.VITE_SUPABASE_ANON_KEY 
                      ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...`
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <strong>Environment:</strong>
                  <p>{import.meta.env.MODE}</p>
                </div>
                <div>
                  <strong>Node Environment:</strong>
                  <p>{import.meta.env.NODE_ENV || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={runConnectionTest} variant="outline">
              🔄 Test Database Connection
            </Button>
            <Button onClick={runAuthTest} variant="outline">
              🔐 Test Authentication
            </Button>
            <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
              🚀 Run All Tests
            </Button>
          </div>

          {/* Error Details */}
          {(connectionDetails?.error || authDetails?.error) && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 text-lg">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                {connectionDetails?.error && (
                  <div className="mb-4">
                    <strong className="text-red-800">Database Error:</strong>
                    <pre className="text-red-700 text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
                      {JSON.stringify(connectionDetails.details || connectionDetails.error, null, 2)}
                    </pre>
                  </div>
                )}
                {authDetails?.error && (
                  <div>
                    <strong className="text-red-800">Auth Error:</strong>
                    <pre className="text-red-700 text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
                      {JSON.stringify(authDetails.details || authDetails.error, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
