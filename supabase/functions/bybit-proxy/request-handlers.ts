
// Request handlers for Bybit proxy
import { corsHeaders } from './cors-cache.ts';
import { BybitRequestParams } from './types.ts';

/**
 * Handles CORS preflight requests
 */
export const handleCorsPreflightRequest = () => {
  console.log("Handling CORS preflight request");
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

/**
 * Validates the request method
 */
export const validateRequestMethod = (method: string) => {
  if (method !== 'POST') {
    console.log("Invalid method:", method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  return null;
};

/**
 * Extracts and validates request parameters
 */
export const extractRequestParameters = async (req: Request): Promise<BybitRequestParams> => {
  const requestData = await req.json();
  console.log("Received request parameters:", JSON.stringify(requestData));
  
  // Default values if not provided
  return {
    tokenId: requestData.tokenId || "USDT",
    currencyId: requestData.currencyId || "NGN",
    verifiedOnly: requestData.verifiedOnly !== undefined ? requestData.verifiedOnly : true,
  };
};
