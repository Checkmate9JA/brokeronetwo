import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from 'lucide-react';

export default function TransferCard({ 
  icon: Icon, 
  title, 
  description, 
  buttonText,
  color = "blue",
  onClick 
}) {
  const colorClasses = {
    blue: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      button: 'border-blue-200 text-blue-700 hover:bg-blue-50'
    },
    green: {
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600', 
      button: 'border-green-200 text-green-700 hover:bg-green-50'
    },
    purple: {
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      button: 'border-purple-200 text-purple-700 hover:bg-purple-50'
    }
  };

  const colors = colorClasses[color];

  return (
    <Card className="p-6 bg-white hover:shadow-md transition-all duration-300 border-gray-100">
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-full ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      
      <Button 
        variant="outline"
        onClick={onClick}
        className={`w-full ${colors.button} font-medium py-3 flex items-center justify-center gap-2`}
      >
        <ArrowRightLeft className="w-4 h-4" />
        {buttonText}
      </Button>
    </Card>
  );
}