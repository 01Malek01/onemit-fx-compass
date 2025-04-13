
/**
 * Utilities for device and connection detection
 */
import { useDeviceDetect } from '@/hooks/use-mobile';

/**
 * Check if the current device is likely a slow device based on connection and memory
 */
export const isLikelySlowDevice = (): boolean => {
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
};

/**
 * Get detailed information about the current network connection
 */
export const getConnectionInfo = () => {
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

/**
 * Hook to detect if the device is mobile with connection awareness
 * @returns Object with isMobile and connection info
 */
export const useSmartDeviceDetection = () => {
  const deviceInfo = useDeviceDetect();
  const isSlow = isLikelySlowDevice();
  
  return {
    ...deviceInfo,
    isSlow,
    isUltraLightMode: deviceInfo.isMobile && isSlow
  };
};
