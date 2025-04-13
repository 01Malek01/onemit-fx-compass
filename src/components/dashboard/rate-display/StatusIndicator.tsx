
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StatusIndicatorProps {
  rate: number | null;
  isStale: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ rate, isStale }) => {
  if (!rate) {
    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  }

  return (
    <>
      <div className={`absolute -left-1 -top-1 w-2 h-2 ${isStale ? "bg-amber-500" : "bg-green-500"} rounded-full animate-ping`}></div>
      <div className={`w-2 h-2 ${isStale ? "bg-amber-500" : "bg-green-500"} rounded-full`}></div>
    </>
  );
};

export default StatusIndicator;
