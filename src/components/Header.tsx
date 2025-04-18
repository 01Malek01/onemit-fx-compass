
import React from 'react';
import { RefreshCw, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  return <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative">
      <div className="relative z-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Oneremit Terminal</h1>
        {lastUpdated ? <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Last updated: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
          </div> : <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {isLoading ? 'Loading rate data...' : 'Welcome to Oneremit Terminal'}
          </p>}
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onRefresh} disabled={isLoading} variant="outline" className="gap-2 text-sm font-medium relative overflow-hidden group" size="sm">
              <RefreshCw className={`h-4 w-4 transition-all duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-90'}`} />
              <span>{isLoading ? 'Updating...' : 'Refresh Rates'}</span>
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Fetch the latest exchange rates</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Background decorative element */}
      <div className="absolute top-0 right-0 h-14 w-[30%] bg-gradient-to-r from-primary/5 to-primary/20 rounded-full blur-3xl -z-10" aria-hidden="true" />
    </header>;
};

export default Header;
