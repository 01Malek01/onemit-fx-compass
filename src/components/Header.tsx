
import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isLoading }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OneRemit FX Dashboard</h1>
        <p className="text-muted-foreground">
          {lastUpdated ? (
            <span className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5" />
              Last updated: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
            </span>
          ) : (
            "Welcome to the FX Cost Engine"
          )}
        </p>
      </div>
      <Button 
        onClick={onRefresh} 
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Updating...' : 'Refresh Rates'}
      </Button>
    </header>
  );
};

export default Header;
