import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MaintenanceModeTest() {
  const { userProfile } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test, result, details = null) => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Check user profile
      addResult('User Profile Check', userProfile ? 'PASS' : 'FAIL', userProfile);

      // Test 2: Check if user is super_admin
      const isSuperAdmin = userProfile?.role === 'super_admin';
      addResult('Super Admin Role Check', isSuperAdmin ? 'PASS' : 'FAIL', `Role: ${userProfile?.role}`);

      // Test 3: Test get_maintenance_mode_info function
      try {
        const { data, error } = await supabase.rpc('get_maintenance_mode_info');
        if (error) {
          addResult('get_maintenance_mode_info Function', 'FAIL', error.message);
        } else {
          addResult('get_maintenance_mode_info Function', 'PASS', data);
        }
      } catch (error) {
        addResult('get_maintenance_mode_info Function', 'ERROR', error.message);
      }

      // Test 4: Test is_maintenance_mode_active function
      try {
        const { data, error } = await supabase.rpc('is_maintenance_mode_active');
        if (error) {
          addResult('is_maintenance_mode_active Function', 'FAIL', error.message);
        } else {
          addResult('is_maintenance_mode_active Function', 'PASS', data);
        }
      } catch (error) {
        addResult('is_maintenance_mode_active Function', 'ERROR', error.message);
      }

      // Test 5: Check maintenance_mode table directly
      try {
        const { data, error } = await supabase.from('maintenance_mode').select('*');
        if (error) {
          addResult('Direct Table Access', 'FAIL', error.message);
        } else {
          addResult('Direct Table Access', 'PASS', `${data.length} records found`);
        }
      } catch (error) {
        addResult('Direct Table Access', 'ERROR', error.message);
      }

    } catch (error) {
      addResult('Test Suite', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Maintenance Mode System Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? 'Running Tests...' : 'Run Tests'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className={`p-3 rounded border ${
                  result.result === 'PASS' ? 'bg-green-50 border-green-200' :
                  result.result === 'FAIL' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.result === 'PASS' ? 'bg-green-100 text-green-800' :
                      result.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.result}
                    </span>
                    <span className="font-medium">{result.test}</span>
                  </div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600">Details</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {typeof result.details === 'object' 
                          ? JSON.stringify(result.details, null, 2)
                          : result.details
                        }
                      </pre>
                    </details>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
