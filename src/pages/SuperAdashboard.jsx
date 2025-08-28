import React from 'react';

export default function SuperAdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
      <p className="mt-4 text-gray-600">Welcome to the Super Admin Dashboard</p>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900">System Status</h2>
        <p className="text-blue-700">All systems operational</p>
      </div>
    </div>
  );
}
