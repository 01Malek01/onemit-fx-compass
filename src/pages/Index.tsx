
import React from 'react';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { useDeviceDetect } from '@/hooks/use-mobile';

const Index = () => {
  const { isMobile } = useDeviceDetect();
  
  return (
    <div className="flex-1 overflow-auto py-2 sm:py-4">
      <DashboardContainer />
      
      <footer className={`mt-6 sm:mt-8 pb-4 text-center text-xs text-muted-foreground ${isMobile ? 'px-3' : ''}`}>
        <p>© {new Date().getFullYear()} Oneremit FX Terminal - Powered by <a href="#" className="text-primary hover:underline">Oneremit</a></p>
      </footer>
    </div>
  );
};

export default Index;

