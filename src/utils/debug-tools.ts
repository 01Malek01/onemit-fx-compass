
// Debug tools for troubleshooting module resolution and runtime errors
export const debugViteModules = () => {
  console.log('Debugging Vite module resolution');
  console.log('Node version:', process.env.NODE_VERSION || 'Unknown');
  
  try {
    // Log environment information that might be helpful
    console.log('Environment:', import.meta.env.MODE);
    console.log('Base URL:', import.meta.env.BASE_URL);
    
    return true;
  } catch (err) {
    console.error('Error in debug tools:', err);
    return false;
  }
};

// Export utility to check for common resolution problems
export const checkRuntimeEnvironment = () => {
  console.log('Checking runtime environment compatibility');
  
  // This will help identify what features are available in current environment
  const envFeatures = {
    hasWindow: typeof window !== 'undefined',
    hasProcess: typeof process !== 'undefined',
    hasModule: typeof module !== 'undefined',
  };
  
  console.log('Environment features:', envFeatures);
  return envFeatures;
};
