import React from 'react';
import { Card } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function MaintenanceMode({ maintenanceInfo }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Under Maintenance
          </h1>
          <p className="text-gray-600">
            {maintenanceInfo?.message || 'We are currently performing scheduled maintenance. Please check back soon.'}
          </p>
        </div>

        <div className="text-xs text-gray-400">
          <p>Thank you for your patience.</p>
          <p>Our team is working hard to get everything back up and running.</p>
        </div>
      </Card>
    </div>
  );
}
