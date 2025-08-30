import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  buttonText, 
  buttonIcon: ButtonIcon,
  color = "blue",
  onClick,
  isLoading = false
}) {
  const colorClasses = {
    blue: {
      cardBg: 'bg-blue-50',
      iconBg: 'bg-blue-600',
      iconColor: 'text-white',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    red: {
      cardBg: 'bg-red-50', 
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
      button: 'bg-red-600 hover:bg-red-700'
    },
    green: {
      cardBg: 'bg-green-50',
      iconBg: 'bg-green-600',
      iconColor: 'text-white',
      button: 'bg-green-600 hover:bg-green-700'
    },
    purple: {
      cardBg: 'bg-purple-50',
      iconBg: 'bg-purple-600', 
      iconColor: 'text-white',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    indigo: {
      cardBg: 'bg-indigo-50',
      iconBg: 'bg-indigo-600',
      iconColor: 'text-white',
      button: 'bg-indigo-600 hover:bg-indigo-700'
    }
  };

  const colors = colorClasses[color];

  return (
    <Card className={`p-6 hover:shadow-md transition-all duration-300 border-gray-100 flex flex-col h-full ${colors.cardBg}`}>
      <div className="flex-grow">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-full ${colors.iconBg}`}>
            <Icon className={`w-6 h-6 ${colors.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={onClick}
        className={`w-full ${colors.button} text-white font-medium py-3 flex items-center justify-center gap-2`}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <ButtonIcon className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </Button>
    </Card>
  );
}