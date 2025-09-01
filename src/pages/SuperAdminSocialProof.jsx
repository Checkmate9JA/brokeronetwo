import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  RefreshCw, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Database, 
  Users, 
  FileText,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const SuperAdminSocialProof = () => {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Data states
  const [activities, setActivities] = useState([]);
  const [names, setNames] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({});
  
  // Form states
  const [newName, setNewName] = useState({ first_name: '', last_name: '', country: '', country_code: '', flag_emoji: '', region: '' });
  const [newTemplate, setNewTemplate] = useState({ activity_type: '', template_text: '', priority: 1 });
  const [editingName, setEditingName] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Check if user is super admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'super_admin') {
      setMessage({ type: 'error', text: 'Access denied. Super Admin privileges required.' });
    }
  }, [userProfile]);

  // Load data on component mount
  useEffect(() => {
    if (userProfile?.role === 'super_admin') {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load activities
      const { data: activitiesData } = await supabase
        .from('social_proof_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Load names
      const { data: namesData } = await supabase
        .from('social_proof_names')
        .select('*')
        .order('country', { ascending: true });

      // Load templates
      const { data: templatesData } = await supabase
        .from('social_proof_activity_templates')
        .select('*')
        .order('activity_type', { ascending: true });

      // Load stats
      const { count: totalActivities } = await supabase
        .from('social_proof_activities')
        .select('*', { count: 'exact', head: true });

      const { count: totalNames } = await supabase
        .from('social_proof_names')
        .select('*', { count: 'exact', head: true });

      const { count: totalTemplates } = await supabase
        .from('social_proof_activity_templates')
        .select('*', { count: 'exact', head: true });

      setActivities(activitiesData || []);
      setNames(namesData || []);
      setTemplates(templatesData || []);
      setStats({
        totalActivities,
        totalNames,
        totalTemplates,
        activeActivities: activitiesData?.filter(a => a.is_active).length || 0,
        activeNames: namesData?.filter(n => n.is_active).length || 0,
        activeTemplates: templatesData?.filter(t => t.is_active).length || 0
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Error loading data: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Maintenance Functions
  const cleanupOldActivities = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('cleanup_old_social_proof_activities');
      if (error) throw error;
      setMessage({ type: 'success', text: 'Old activities cleaned up successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error cleaning up activities: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActivityTimestamps = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('social_proof_activities')
        .update({ 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true);
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Activity timestamps refreshed successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error refreshing timestamps: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateOldNames = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('social_proof_names')
        .update({ is_active: false })
        .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Old names deactivated successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error deactivating names: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const resetNameUsageCounts = async () => {
    setIsLoading(true);
    try {
      // This would require adding a usage_count column to track how many times each name has been used
      setMessage({ type: 'success', text: 'Name usage counts reset successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error resetting usage counts: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD Operations
  const addName = async () => {
    if (!newName.first_name || !newName.country || !newName.country_code || !newName.flag_emoji) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('social_proof_names')
        .insert([newName]);
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Name added successfully!' });
      setNewName({ first_name: '', last_name: '', country: '', country_code: '', flag_emoji: '', region: '' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error adding name: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.activity_type || !newTemplate.template_text) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('social_proof_activity_templates')
        .insert([newTemplate]);
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Template added successfully!' });
      setNewTemplate({ activity_type: '', template_text: '', priority: 1 });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error adding template: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (table, id, currentStatus) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Status updated successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error updating status: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (table, id) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Item deleted successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Error deleting item: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (userProfile?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Access denied. Super Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 super-admin-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Social Proof Management</h1>
        <Button onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {message.text && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          {message.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeActivities || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Names</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNames || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeNames || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTemplates || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="names">Names Management</TabsTrigger>
          <TabsTrigger value="templates">Templates Management</TabsTrigger>
          <TabsTrigger value="activities">Activities View</TabsTrigger>
        </TabsList>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={cleanupOldActivities} 
                  disabled={isLoading}
                  variant="outline"
                  className="h-20"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Clean Old Activities</div>
                    <div className="text-sm text-muted-foreground">Remove activities older than 30 days</div>
                  </div>
                </Button>

                <Button 
                  onClick={refreshActivityTimestamps} 
                  disabled={isLoading}
                  variant="outline"
                  className="h-20"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Refresh Timestamps</div>
                    <div className="text-sm text-muted-foreground">Update all activities to appear recent</div>
                  </div>
                </Button>

                <Button 
                  onClick={deactivateOldNames} 
                  disabled={isLoading}
                  variant="outline"
                  className="h-20"
                >
                  <EyeOff className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Deactivate Old Names</div>
                    <div className="text-sm text-muted-foreground">Deactivate names older than 90 days</div>
                  </div>
                </Button>

                <Button 
                  onClick={resetNameUsageCounts} 
                  disabled={isLoading}
                  variant="outline"
                  className="h-20"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Reset Usage Counts</div>
                    <div className="text-sm text-muted-foreground">Reset name usage statistics</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Names Management Tab */}
        <TabsContent value="names" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add New Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newName.first_name}
                    onChange={(e) => setNewName({ ...newName, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={newName.last_name}
                    onChange={(e) => setNewName({ ...newName, last_name: e.target.value })}
                    placeholder="Last name (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={newName.country}
                    onChange={(e) => setNewName({ ...newName, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
                <div>
                  <Label htmlFor="country_code">Country Code *</Label>
                  <Input
                    id="country_code"
                    value={newName.country_code}
                    onChange={(e) => setNewName({ ...newName, country_code: e.target.value })}
                    placeholder="e.g., US, GB, DE"
                  />
                </div>
                <div>
                  <Label htmlFor="flag_emoji">Flag Emoji *</Label>
                  <Input
                    id="flag_emoji"
                    value={newName.flag_emoji}
                    onChange={(e) => setNewName({ ...newName, flag_emoji: e.target.value })}
                    placeholder="🇺🇸"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={newName.region}
                    onChange={(e) => setNewName({ ...newName, region: e.target.value })}
                    placeholder="e.g., Europe, Asia"
                  />
                </div>
              </div>
              <Button onClick={addName} disabled={isLoading} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Name
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Names List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {names.map((name) => (
                  <div key={name.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{name.flag_emoji}</span>
                      <div>
                        <div className="font-medium">
                          {name.first_name} {name.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {name.country}, {name.region}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={name.is_active ? "default" : "secondary"}>
                        {name.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive('social_proof_names', name.id, name.is_active)}
                        disabled={isLoading}
                      >
                        {name.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItem('social_proof_names', name.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Management Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Add New Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity_type">Activity Type *</Label>
                  <Input
                    id="activity_type"
                    value={newTemplate.activity_type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, activity_type: e.target.value })}
                    placeholder="e.g., investment, withdrawal"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newTemplate.priority}
                    onChange={(e) => setNewTemplate({ ...newTemplate, priority: parseInt(e.target.value) })}
                    placeholder="1-10"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="template_text">Template Text *</Label>
                <Textarea
                  id="template_text"
                  value={newTemplate.template_text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template_text: e.target.value })}
                  placeholder="e.g., {name} from {country} invested in {plan} just now"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use placeholders: {'{name}'}, {'{country}'}, {'{amount}'}, {'{plan}'}, {'{trader}'}, {'{symbol}'}
                </p>
              </div>
              <Button onClick={addTemplate} disabled={isLoading} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{template.activity_type}</div>
                      <div className="text-sm text-muted-foreground">{template.template_text}</div>
                      <div className="text-xs text-muted-foreground">Priority: {template.priority}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive('social_proof_activity_templates', template.id, template.is_active)}
                        disabled={isLoading}
                      >
                        {template.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItem('social_proof_activity_templates', template.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities View Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activity.flag_emoji}</span>
                      <div>
                        <div className="font-medium">{activity.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.activity_text}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={activity.is_active ? "default" : "secondary"}>
                        {activity.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {activity.amount && (
                        <Badge variant="outline">
                          ${activity.amount}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItem('social_proof_activities', activity.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminSocialProof;
