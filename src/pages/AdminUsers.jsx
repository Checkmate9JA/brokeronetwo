
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { userProfile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching users from Supabase...')
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Error fetching users:', fetchError)
        setError(fetchError.message)
        toast({
          title: "Error fetching users",
          description: fetchError.message,
          variant: "destructive",
        })
        return
      }

      console.log('✅ Users fetched successfully:', data)
      setUsers(data || [])
      
      toast({
        title: "Users loaded",
        description: `Found ${data?.length || 0} users`,
        variant: "success",
      })
      
    } catch (err) {
      console.error('❌ Exception fetching users:', err)
      setError(err.message)
      toast({
        title: "Error fetching users",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'admin':
        return 'default'
      case 'user':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Users</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchUsers} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-600 mt-2">
            Manage all users in the system
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <p className="text-gray-600">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'user').length}
              </div>
              <p className="text-gray-600">Regular Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-gray-600">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'super_admin').length}
              </div>
              <p className="text-gray-600">Super Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  List of all registered users in the system
                </CardDescription>
              </div>
              <Button onClick={fetchUsers} variant="outline">
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Balance</th>
                      <th className="text-left p-3 font-medium">Joined</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{user.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div>Total: ${user.total_balance || 0}</div>
                            <div className="text-gray-500">
                              Wallet: ${user.deposit_wallet || 0}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify({ 
                  userCount: users.length, 
                  currentUser: userProfile,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
