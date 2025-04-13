
import React from 'react';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { UserMenu } from '@/components/auth/UserMenu';

// Create a utility to set global console settings
const setupConsoleSettings = () => {
  // In production, limit console output to warnings and errors only
  if (process.env.NODE_ENV === 'production') {
    const originalConsoleLog = console.log;
    const originalConsoleDebug = console.debug;
    const originalConsoleInfo = console.info;
    
    console.log = (...args) => {
      // Only show logs in production if they are important
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('error') || 
           args[0].includes('critical') || 
           args[0].includes('warn'))) {
        originalConsoleLog.apply(console, args);
      }
    };
    
    console.debug = (...args) => {
      // Disable debug in production
    };
    
    console.info = (...args) => {
      // Disable info in production
    };
  }
  
  // In development, group repeated logs
  if (process.env.NODE_ENV === 'development') {
    // Add logic for better development logs if needed
  }
};

const Index = () => {
  // Set up console settings on initial render
  React.useEffect(() => {
    setupConsoleSettings();
  }, []);
  
  return (
    <div className="flex-1 overflow-auto py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-end mb-4">
          <UserMenu />
        </div>
      </div>
      
      <DashboardContainer />
      
      <footer className="mt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Oneremit FX Terminal - Powered by <a href="#" className="text-primary hover:underline">Oneremit</a></p>
      </footer>
    </div>
  );
};

export default Index;
