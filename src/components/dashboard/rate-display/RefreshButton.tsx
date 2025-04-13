
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => Promise<boolean>;
  isLoading: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, isLoading }) => {
  return (
    <Button 
      onClick={onRefresh} 
      variant="outline" 
      size="sm" 
      disabled={isLoading}
      className="gap-1.5 relative overflow-hidden"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Updating...' : 'Refresh'}
    </Button>
  );
};

export default RefreshButton;
