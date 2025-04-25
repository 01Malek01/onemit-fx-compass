
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase-client.ts";

/**
 * Edge function that provides currency rates for external integrations like Telegram bots
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get query parameters if any
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'full';
    const currency = url.searchParams.get('currency') || 'all';
    
    // Get latest USDT/NGN rate
    const { data: usdtRates, error: usdtError } = await supabaseClient
      .from('usdt_ngn_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (usdtError) {
      throw new Error(`Failed to fetch USDT/NGN rate: ${usdtError.message}`);
    }
    
    const usdtNgnRate = usdtRates?.[0]?.rate || 1580;
    
    // Get latest cost prices
    const { data: currencyRates, error: ratesError } = await supabaseClient
      .from('currency_rates')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (ratesError) {
      throw new Error(`Failed to fetch currency rates: ${ratesError.message}`);
    }
    
    // Create rates object
    const rates = {};
    currencyRates.forEach(rate => {
      rates[rate.currency_code] = parseFloat(rate.rate);
    });
    
    // Format the data based on the format parameter
    let responseData;
    
    if (format === 'simple') {
      // Simple format: just the rates without metadata
      if (currency !== 'all' && rates[currency]) {
        responseData = {
          currency: currency,
          rate: rates[currency],
          usdt_ngn: usdtNgnRate
        };
      } else {
        responseData = {
          rates: rates,
          usdt_ngn: usdtNgnRate
        };
      }
    } else {
      // Full format with timestamp and metadata
      responseData = {
        usdt_ngn: {
          rate: usdtNgnRate,
          timestamp: usdtRates?.[0]?.created_at || new Date().toISOString()
        },
        currencies: currency !== 'all' && rates[currency] 
          ? { [currency]: rates[currency] }
          : rates,
        last_updated: new Date().toISOString()
      };
    }
    
    // Return the data
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in get-rates-api function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while fetching rates',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
