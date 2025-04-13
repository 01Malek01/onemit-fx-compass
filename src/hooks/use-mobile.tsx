
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number | undefined
  connection: { 
    type: string | null,
    effectiveType: string | null,
    downlink: number | null,
    saveData: boolean | null
  }
}

// In-memory cache for device settings to prevent unnecessary rerenders
const deviceCache = {
  currentInfo: null as DeviceInfo | null,
  timestamp: 0,
  
  isValid() {
    return this.currentInfo !== null && Date.now() - this.timestamp < 5000; // 5 second cache
  },
  
  update(info: DeviceInfo) {
    this.currentInfo = info;
    this.timestamp = Date.now();
  },
  
  get() {
    return this.currentInfo;
  }
};

/**
 * Check if device is likely slow based on connection quality or device memory
 */
export function isLikelySlowDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check network connection type if available
  // @ts-ignore - Navigator connection is not in standard typings
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    // Consider 2G or slow 3G as slow
    if (connection.effectiveType === '2g' || 
        connection.effectiveType === 'slow-2g' ||
        connection.downlink < 1.0) {
      return true;
    }
    
    // If save-data is enabled, the user has opted for reduced data usage
    if (connection.saveData) {
      return true;
    }
  }
  
  // Check device memory if available
  // @ts-ignore - Navigator deviceMemory is not in standard typings
  if (navigator.deviceMemory && navigator.deviceMemory < 2) {
    return true;
  }
  
  return false;
}

export function useDeviceDetect(): DeviceInfo {
  // Initial state uses cached value if available to prevent flash of wrong layout
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(
    deviceCache.isValid() ? deviceCache.get()! : {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: undefined,
      connection: {
        type: null,
        effectiveType: null,
        downlink: null,
        saveData: null
      }
    }
  );
  
  React.useEffect(() => {
    const getConnectionInfo = () => {
      if (typeof navigator === 'undefined') {
        return {
          type: null,
          effectiveType: null,
          downlink: null, 
          saveData: null
        };
      }
      
      // @ts-ignore - Navigator connection is not in standard typings
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (!connection) {
        return {
          type: null,
          effectiveType: null,
          downlink: null,
          saveData: null
        };
      }
      
      return {
        type: connection.type || null,
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        saveData: connection.saveData || null
      };
    };
    
    // Function to update device info
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      const isDesktop = width >= TABLET_BREAKPOINT;
      
      const info = {
        isMobile,
        isTablet,
        isDesktop,
        width,
        connection: getConnectionInfo()
      };
      
      setDeviceInfo(info);
      deviceCache.update(info);
    };
    
    // Initial detection
    handleResize();
    
    // Listen for resize events
    window.addEventListener("resize", handleResize);
    
    // Connection change listener for supported browsers
    // @ts-ignore - Navigator connection is not in standard typings
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleResize);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (connection) {
        connection.removeEventListener('change', handleResize);
      }
    };
  }, []);
  
  return deviceInfo;
}

export function useIsMobile(): boolean {
  const { isMobile } = useDeviceDetect();
  return isMobile;
}
