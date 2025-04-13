
// Follow Deno Deploy runtime compatibility
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, checkCache, createCacheKey, updateCache } from './cors-cache.ts';
import { callBybitApi, createApiPayload } from './api-utils.ts';
import { processApiResponse } from './response-processor.ts';
import { handleCorsPreflightRequest, validateRequestMethod, extractRequestParameters } from './request-handlers.ts';

/**
 * Main handler for bybit-proxy function
 */
serve(async (req) => {
  console.log("Bybit proxy request received:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  try {
    // Validate request method
    const methodError = validateRequestMethod(req.method);
    if (methodError) return methodError;

    // Extract parameters from request
    const params = await extractRequestParameters(req);
    
    // Create a cache key and check for cached response
    const cacheKey = createCacheKey(params);
    const { data: cachedResponse, found: isCached } = checkCache(cacheKey);
    if (isCached) {
      return new Response(JSON.stringify(cachedResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Create payload for Bybit API
    const payload = createApiPayload(params);
    
    // Call the Bybit API
    const { response, error } = await callBybitApi(payload);
    
    // Handle errors from API call
    if (error) {
      return error;
    }
    
    // Handle API response
    if (!response.ok) {
      console.error(`Bybit API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `API responded with status: ${response.status}`,
        details: errorText
      }), {
        status: 502, // Bad Gateway
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Parse and process the successful response
    const data = await response.json();
    console.log("Bybit API response status code:", response.status);
    console.log("Bybit API response ret_code:", data.ret_code);
    
    // Process the response data
    const processedResponse = processApiResponse(data);
    
    // Cache successful responses
    if (processedResponse.success) {
      updateCache(cacheKey, processedResponse);
    }
    
    // Return the processed response
    return new Response(JSON.stringify(processedResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in bybit-proxy function:", error.message);
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
