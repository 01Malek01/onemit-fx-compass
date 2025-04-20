import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchLatestTicker } from '@/services/bybit/bybit-api';
import { storeTickerData } from '@/services/bybit/bybit-storage';
import { logger } from '@/utils/logUtils';
import { useNotifications } from '@/contexts/notifications/NotificationContext';

interface UseBybitRateFetcherProps {
  setUsdtNgnRate?: (rate: number) => void;
  setLastUpdated?: (date: Date | null) => void;
  setIsLoading?: (loading: boolean) => void;
}

export const useBybitRateFetcher = (props?: UseBybitRateFetcherProps) => {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  const fetchBybitRates = async () => {
    const internalSetIsLoading = props?.setIsLoading || setIsLoading;
    internalSetIsLoading(true);
    
    try {
      logger.info("Fetching latest ticker data from Bybit API");
      
      const data = await fetchLatestTicker('BTCUSDT');
      
      if (data && data.success && data.price) {
        logger.info(`Successfully fetched Bybit rate: ${data.price}`);
        
        await storeTickerData({
          symbol: data.symbol,
          price: data.price,
          timestamp: data.timestamp
        });
        
        const now = new Date();
        setLastFetchTime(now);
        if (props?.setLastUpdated) {
          props.setLastUpdated(now);
        }

        if (props?.setUsdtNgnRate) {
          props.setUsdtNgnRate(Number(data.price));
        }

        toast.success('Bybit rates updated successfully');
        
        addNotification({
          title: 'Bybit rates updated',
          description: `BTC/USDT: ${Number(data.price).toLocaleString()}`,
          type: 'success'
        });
        
        return data.price;
      } else {
        throw new Error('Invalid response format or no price data');
      }
    } catch (error) {
      logger.error('Error fetching Bybit rates:', error);
      
      toast.error('Failed to fetch Bybit rates');
      
      addNotification({
        title: 'Failed to fetch Bybit rates',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      });
      
      return null;
    } finally {
      internalSetIsLoading(false);
    }
  };

  const refreshBybitRate = fetchBybitRates;
  const fetchBybitRate = fetchBybitRates;

  return {
    fetchBybitRates,
    fetchBybitRate,
    refreshBybitRate,
    lastFetchTime,
    isLoading
  };
};
