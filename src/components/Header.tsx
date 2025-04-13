
import React from 'react';
import { format } from 'date-fns';
import RefreshButton from './dashboard/rate-display/RefreshButton';
import TimestampDisplay from './dashboard/rate-display/TimestampDisplay';
import AuthHeader from './AuthHeader';
import { useDeviceDetect } from '@/hooks/use-mobile';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh?: () => Promise<boolean>;
  isLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  onRefresh = async () => false,
  isLoading = false,
}) => {
  const { isMobile } = useDeviceDetect();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center border-b border-border/10 py-4 px-3 sm:px-4">
      <div className="flex items-center">
        <div className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
          Oneremit FX Terminal
        </div>
        <div className="ml-2 text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
          {format(new Date(), 'yyyy')}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between w-full sm:w-auto mt-3 sm:mt-0 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {!isMobile && (
            <TimestampDisplay 
              lastUpdated={lastUpdated} 
              rate={null} 
              isStale={false} 
            />
          )}
          <RefreshButton 
            onRefresh={onRefresh} 
            isLoading={isLoading} 
          />
        </div>
        <AuthHeader />
      </div>
      
      {isMobile && lastUpdated && (
        <div className="w-full mt-2 text-xs text-muted-foreground text-center">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      )}
    </div>
  );
};

export default Header;

