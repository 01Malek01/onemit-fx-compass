
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StatusIndicatorProps {
  rate: number | null;
  isStale: boolean;
  hasNetworkError?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  rate, 
  isStale,
  hasNetworkError = false 
}) => {
  if (hasNetworkError) {
    return (
      <div className="relative">
        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-70"></div>
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-glow"></div>
      </div>
    );
  }
  
  if (!rate) {
    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  }

  return (
    <div className="relative">
      <div className={`absolute -left-1 -top-1 w-2.5 h-2.5 ${isStale ? "bg-amber-500" : "bg-green-500"} rounded-full animate-ping opacity-70`}></div>
      <div className={`w-2.5 h-2.5 ${isStale ? "bg-amber-500" : "bg-green-500"} rounded-full shadow-glow`}></div>
    </div>
  );
};

export default StatusIndicator;
