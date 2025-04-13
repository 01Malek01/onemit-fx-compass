
import axios from "axios";

export interface VertoFxRate {
  rate: number;
  inverse_rate: number;
  raw_rate: number;
  raw_inverse: number;
  rate_after_spread: number;
  unit_spread?: number;
  provider?: string;
  rate_type?: string;
  percent_change?: number;
}

/**
 * Get the exchange rate between two currencies from VertoFX
 */
export async function getVertoFxRate(fromCurrency: string, toCurrency: string): Promise<VertoFxRate | null> {
  const url = "https://api-currency-beta.vertofx.com/p/currencies/exchange-rate";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Origin": "https://www.vertofx.com",
    "Referer": "https://www.vertofx.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
  };

  const payload = {
    currencyFrom: { label: fromCurrency },
    currencyTo: { label: toCurrency },
  };

  try {
    const response = await axios.post(url, payload, { headers });
    const data = response.data;

    if (data?.success) {
      const rawRate = data.rate;
      const spreadRate = data.rateAfterSpread ?? rawRate;

      const isNgnBase = fromCurrency === "NGN";

      return {
        rate: isNgnBase ? spreadRate : 1 / spreadRate,
        inverse_rate: isNgnBase ? 1 / spreadRate : spreadRate,
        raw_rate: rawRate,
        raw_inverse: data.reversedRate,
        rate_after_spread: spreadRate,
        unit_spread: data.unitSpread,
        provider: data.provider,
        rate_type: data.rateType,
        percent_change: data.overnightPercentChange,
      };
    }

    return null;
  } catch (error) {
    console.error("VertoFX fetch error:", error);
    return null;
  }
}

/**
 * Fetch both NGN → XXX and XXX → NGN rates for a predefined set of currencies
 */
export async function getAllNgnRates(): Promise<Record<string, VertoFxRate>> {
  const currencies = ["USD", "EUR", "GBP", "CAD"];
  const results: Record<string, VertoFxRate> = {};

  for (const currency of currencies) {
    const ngnToCurr = await getVertoFxRate("NGN", currency);
    if (ngnToCurr) {
      results[`NGN-${currency}`] = ngnToCurr;
    }

    const currToNgn = await getVertoFxRate(currency, "NGN");
    if (currToNgn) {
      results[`${currency}-NGN`] = currToNgn;
    }
  }

  return results;
}
