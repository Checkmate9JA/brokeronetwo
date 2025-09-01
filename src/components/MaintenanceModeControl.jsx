import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, AlertTriangle, Power, Settings, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MaintenanceModeControl({ isOpen, onClose }) {
  const { userProfile } = useAuth();
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);

  const resetModalState = () => {
    setMaintenanceInfo(null);
    setIsEnabled(false);
    setMessage('');
    setDurationMinutes(60);
    setError(null);
    setSuccess(null);
    setIsLoading(false);
    setIsUpdating(false);
  };

  const loadMaintenanceInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading maintenance info...');
      console.log('User profile:', userProfile);

      const { data, error: fetchError } = await supabase.rpc('get_maintenance_mode_info');
      
      console.log('Supabase response:', { data, error: fetchError });
      
      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      console.log('Setting maintenance info:', data);
      setMaintenanceInfo(data);
      
      // Ensure we set the state based on the actual database value
      const currentEnabledState = data?.is_enabled || false;
      setIsEnabled(currentEnabledState);
      setMessage(data?.message || '');
      setDurationMinutes(data?.estimated_duration_minutes || 60);
      
      console.log('State updated - isEnabled:', currentEnabledState, 'message:', data?.message, 'duration:', data?.estimated_duration_minutes);
      console.log('Full maintenance info from DB:', data);
    } catch (error) {
      console.error('Error loading maintenance info:', error);
      setError(`Failed to load maintenance information: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      // Ensure we have a valid user ID
      if (!userProfile?.id) {
        throw new Error('User profile not found. Please refresh and try again.');
      }

      const { data, error: toggleError } = await supabase.rpc('toggle_maintenance_mode', {
        new_status: !isEnabled,
        maintenance_message: message,
        duration_minutes: durationMinutes,
        user_id: userProfile.id
      });

      if (toggleError) {
        throw toggleError;
      }

      setIsEnabled(!isEnabled);
      setSuccess(`Maintenance mode ${!isEnabled ? 'enabled' : 'disabled'} successfully`);
      
      // Update local maintenanceInfo without full reload to preserve UI state
      if (data) {
        setMaintenanceInfo(prev => ({
          ...prev,
          is_enabled: !isEnabled,
          message: message,
          estimated_duration_minutes: durationMinutes,
          started_at: !isEnabled ? new Date().toISOString() : null,
          started_by: !isEnabled ? userProfile.id : null
        }));
      }
      
      // Don't call loadMaintenanceInfo() here to prevent state reset
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      setError(error.message || 'Failed to toggle maintenance mode');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      // Ensure we have a valid user ID
      if (!userProfile?.id) {
        throw new Error('User profile not found. Please refresh and try again.');
      }

      // Save settings without changing the enabled state
      const { data, error: updateError } = await supabase.rpc('toggle_maintenance_mode', {
        new_status: isEnabled, // Keep current state
        maintenance_message: message,
        duration_minutes: durationMinutes,
        user_id: userProfile.id
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Maintenance settings saved successfully');
      
      // Update local maintenanceInfo without full reload to preserve UI state
      if (data) {
        setMaintenanceInfo(prev => ({
          ...prev,
          message: message,
          estimated_duration_minutes: durationMinutes
        }));
      }
      
      // Don't call loadMaintenanceInfo() here to prevent state reset
      // The settings are already saved and local state is updated
    } catch (error) {
      console.error('Error updating maintenance settings:', error);
      setError(error.message || 'Failed to update maintenance settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadMaintenanceInfo();
  };

  const forceRefreshOnOpen = async () => {
    // Force a fresh fetch from database when modal opens
    console.log('Force refreshing maintenance mode state on modal open...');
    await loadMaintenanceInfo();
  };

  useEffect(() => {
    if (isOpen) {
      // Check if user is properly authenticated
      if (!userProfile?.id) {
        setError('User authentication required. Please refresh and try again.');
        setIsLoading(false);
        return;
      }
      // Force refresh when modal opens to ensure current state
      forceRefreshOnOpen();
    } else {
      // Reset state when modal closes
      resetModalState();
    }
  }, [isOpen, userProfile?.id]); // Changed dependency to userProfile?.id

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔧 MaintenanceModeControl State Changed:');
    console.log('- isEnabled:', isEnabled);
    console.log('- message:', message);
    console.log('- durationMinutes:', durationMinutes);
    console.log('- maintenanceInfo:', maintenanceInfo);
  }, [isEnabled, message, durationMinutes, maintenanceInfo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Maintenance Mode Control</h2>
                <p className="text-sm text-gray-500">Manage system maintenance status</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading maintenance mode status...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">


              {/* Current Status Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Power className="w-5 h-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Status:</span>
                      <Badge variant={maintenanceInfo?.is_enabled ? "destructive" : "secondary"}>
                        {maintenanceInfo?.is_enabled ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </div>
                    {maintenanceInfo?.is_enabled && (
                      <>
                        <div className="text-sm text-gray-600 mb-1">
                          Started: {maintenanceInfo?.started_at ? new Date(maintenanceInfo.started_at).toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Duration: {maintenanceInfo?.estimated_duration_minutes === -1 ? 'Indefinite' : `${maintenanceInfo?.estimated_duration_minutes || 0} minutes`}
                        </div>
                        <div className="text-sm text-gray-600">
                          Message: {maintenanceInfo?.message || 'No message set'}
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-purple-600 font-medium mt-3">
                    ⚠️ Only Super Admins (super_admin role) can control maintenance mode
                  </p>
                </CardContent>
              </Card>

              {/* Settings Configuration - COMES FIRST */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Maintenance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="maintenance-message" className="text-sm font-medium">
                      Maintenance Message
                    </Label>
                    <Textarea
                      id="maintenance-message"
                      placeholder="Enter maintenance message for users..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="indefinite-mode"
                        checked={durationMinutes === -1}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDurationMinutes(-1);
                          } else {
                            setDurationMinutes(60);
                          }
                        }}
                      />
                      <Label htmlFor="indefinite-mode" className="text-sm font-medium">
                        Indefinite Maintenance Mode
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      When enabled, maintenance mode will continue indefinitely until manually disabled
                    </p>
                  </div>
                  
                  {durationMinutes !== -1 && (
                    <div>
                      <Label htmlFor="duration" className="text-sm font-medium">
                        Estimated Duration (minutes)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="1440"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Range: 1 minute to 24 hours (1440 minutes)
                      </p>
                    </div>
                  )}
                  
                  {durationMinutes === -1 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Indefinite Mode Active</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Maintenance mode will continue indefinitely. Users will see maintenance page until manually disabled.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Settings Button - COMES BEFORE Enable/Disable */}
              <div className="mb-6">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isUpdating}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                {success && (
                  <p className="text-green-600 text-sm mt-2 text-center">✅ Settings saved successfully!</p>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Your toggle selections (like Indefinite Mode) are preserved when saving
                </p>
              </div>

              {/* Enable/Disable Toggle - COMES AFTER Save Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Power className="w-5 h-5" />
                    Maintenance Mode Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Toggle Maintenance Mode:</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={setIsEnabled}
                        disabled={isUpdating}
                      />
                    </div>
                    
                    <div className="text-center">
                      <Button
                        onClick={handleToggleMaintenance}
                        disabled={isUpdating}
                        variant={isEnabled ? "destructive" : "default"}
                        className="w-full"
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            {isEnabled ? "Disabling..." : "Enabling..."}
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            {isEnabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {isEnabled && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800 font-medium">Maintenance Mode Active</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Users will see the maintenance page. Only Super Admins can access the system.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 font-medium">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
