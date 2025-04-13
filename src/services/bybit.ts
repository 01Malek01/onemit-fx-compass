
import axios from "axios";

export interface P2PTrader {
  price: number;
  nickname: string;
  completion_rate: number;
  orders: number;
  available_quantity: number;
  min_amount: number;
  max_amount: number;
  verified: boolean;
  payment_methods: string[];
  order_completion_time: string;
}

export interface P2PMarketSummary {
  total_traders: number;
  price_range: {
    min: number;
    max: number;
    average: number;
    median: number;
    mode: number;
  };
}

export interface BybitP2PResponse {
  traders: P2PTrader[];
  market_summary: P2PMarketSummary;
}

export const getBybitP2PRate = async (
  currencyId: string = "NGN",
  tokenId: string = "USDT",
  verifiedOnly: boolean = true
): Promise<BybitP2PResponse | null> => {
  const url = "https://api2.bybit.com/fiat/otc/item/online";

  const headers = {
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://www.bybit.com",
    "Host": "api2.bybit.com",
    "Referer": "https://www.bybit.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  const payload = {
    userId: "",
    tokenId,
    currencyId,
    payment: [],
    side: "0", // 0 = buying crypto (from advertisers)
    size: "10",
    page: "2",
    amount: "",
    itemRegion: 1,
    paymentPeriod: [],
    sortType: "TRADE_PRICE",
    bulkMaker: false,
    canTrade: true,
    vaMaker: verifiedOnly,
    verificationFilter: 0,
  };

  try {
    const response = await axios.post(url, payload, { headers });
    const data = response.data;

    if (
      data.ret_code === 0 &&
      data.result &&
      data.result.items &&
      data.result.items.length > 0
    ) {
      const items = data.result.items;

      const traders = items.map((item: any) => ({
        price: parseFloat(item.price),
        nickname: item.nickName,
        completion_rate: item.recentExecuteRate,
        orders: item.recentOrderNum,
        available_quantity: parseFloat(item.lastQuantity),
        min_amount: parseFloat(item.minAmount),
        max_amount: parseFloat(item.maxAmount),
        verified: !!item.authTag,
        payment_methods: item.payments ?? [],
        order_completion_time: item.orderFinishTime ?? "15Min(s)",
      }));

      const prices = traders.map((t) => t.price);
      const average =
        prices.reduce((sum, p) => sum + p, 0) / (prices.length || 1);

      const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];

      return {
        traders,
        market_summary: {
          total_traders: prices.length,
          price_range: {
            min: Math.min(...prices),
            max: Math.max(...prices),
            average,
            median,
            mode: prices[0], // optional: implement actual mode logic if needed
          },
        },
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching Bybit P2P rate:", error);
    return null;
  }
};

// Function to save Bybit rate to Supabase
export const saveBybitRate = async (rate: number): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.from("usdt_ngn_rates").insert([
      {
        rate,
        source: "bybit",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("❌ Failed to save Bybit rate:", error);
      return false;
    } else {
      console.log("✅ Bybit rate saved:", rate);
      return true;
    }
  } catch (error) {
    console.error("❌ Error in saveBybitRate:", error);
    return false;
  }
};
