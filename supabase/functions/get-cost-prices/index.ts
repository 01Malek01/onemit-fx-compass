
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error } = await supabaseClient
      .from('cost_prices')
      .select('prices')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error fetching cost prices:', error);
      return new Response(JSON.stringify({
        USD: 0, EUR: 0, GBP: 0, CAD: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(data.prices), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch cost prices:', error);
    return new Response(JSON.stringify({
      USD: 0, EUR: 0, GBP: 0, CAD: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
