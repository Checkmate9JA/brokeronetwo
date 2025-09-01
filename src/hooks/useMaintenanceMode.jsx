import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    checkMaintenanceMode();
  }, [user, userProfile]);

  const checkMaintenanceMode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔧 Checking maintenance mode...');
      console.log('User:', user);
      console.log('User Profile:', userProfile);
      console.log('User Role:', userProfile?.role);

      // If no user, no need to check maintenance mode
      if (!user) {
        console.log('No user, maintenance mode: false');
        setIsMaintenanceMode(false);
        setIsLoading(false);
        return;
      }

      // ONLY Super Admins are unaffected by maintenance mode
      // Regular admins and users will see maintenance page
      if (userProfile?.role === 'super_admin') {
        console.log('Super admin detected, bypassing maintenance mode');
        setIsMaintenanceMode(false);
        setIsLoading(false);
        return;
      }

      // Check if maintenance mode is active
      console.log('Checking if maintenance mode is active...');
      const { data, error } = await supabase.rpc('is_maintenance_mode_active');
      
      console.log('Maintenance mode check result:', { data, error });
      
      if (error) {
        console.error('Error checking maintenance mode:', error);
        setError(error.message);
        setIsMaintenanceMode(false);
      } else {
        console.log('Setting maintenance mode to:', data);
        setIsMaintenanceMode(data);
        
        // If maintenance mode is active, get additional info
        if (data) {
          console.log('Getting maintenance mode info...');
          const { data: infoData, error: infoError } = await supabase.rpc('get_maintenance_mode_info');
          console.log('Maintenance info result:', { infoData, infoError });
          if (!infoError && infoData && infoData.length > 0) {
            setMaintenanceInfo(infoData[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setError(error.message);
      setIsMaintenanceMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMaintenanceMode = () => {
    checkMaintenanceMode();
  };

  return {
    isMaintenanceMode,
    maintenanceInfo,
    isLoading,
    error,
    refreshMaintenanceMode
  };
}
