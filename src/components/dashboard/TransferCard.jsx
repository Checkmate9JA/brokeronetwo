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
      cardBg: 'bg-white dark:bg-blue-900/30',
      iconBg: 'bg-blue-50 dark:bg-white',
      iconColor: 'text-blue-600 dark:text-blue-600',
      button: 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-300 dark:text-white dark:hover:bg-blue-800/50'
    },
    green: {
      cardBg: 'bg-white dark:bg-green-900/30',
      iconBg: 'bg-green-50 dark:bg-white', 
      iconColor: 'text-green-600 dark:text-green-600',
      button: 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-300 dark:text-white dark:hover:bg-green-800/50'
    },
    purple: {
      cardBg: 'bg-white dark:bg-purple-900/30',
      iconBg: 'bg-purple-50 dark:bg-white',
      iconColor: 'text-purple-600 dark:text-purple-600',
      button: 'border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-300 dark:text-white dark:hover:bg-purple-800/50'
    }
  };

  const colors = colorClasses[color];

  return (
    <Card className={`p-6 hover:shadow-md transition-all duration-300 border-gray-100 dark:border-gray-700 ${colors.cardBg}`}>
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-full ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-white leading-relaxed">{description}</p>
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