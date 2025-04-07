
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
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          OneRemit FX Dashboard
        </h1>
        {lastUpdated ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5" />
            Last updated: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Welcome to the FX Cost Engine</p>
        )}
      </div>
      <Button 
        onClick={onRefresh} 
        disabled={isLoading}
        variant="outline"
        className="gap-2 text-sm font-medium"
        size="sm"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Updating...' : 'Refresh Rates'}
      </Button>
    </header>
  );
};

export default Header;
