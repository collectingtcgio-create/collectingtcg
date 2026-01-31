import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Normalize a string for use in identifiers
function normalizeForKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Parse a card key to extract components
function parseCardKey(cardKey: string): { game: string; identifier: string } {
  // Handle productId-based keys: "game:pid:12345"
  if (cardKey.includes(':pid:')) {
    const [game, , productId] = cardKey.split(':');
    return { game, identifier: `${normalizeForKey(game)}__pid__${productId}` };
  }
  
  // Handle normalized keys: "game:cardname:setname:cardnumber"
  const parts = cardKey.split(':');
  const identifier = parts.map(p => normalizeForKey(p)).join('__');
  return { game: parts[0] || 'unknown', identifier };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[get-card-image] Function invoked");

  try {
    const { cardKey } = await req.json();

    console.log("[get-card-image] Request received:");
    console.log("[get-card-image]   cardKey:", cardKey);

    // Validate required fields
    if (!cardKey) {
      console.log("[get-card-image] Error: cardKey is required");
      return new Response(
        JSON.stringify({ error: "cardKey is required", imageUrl: null, exists: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for storage operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse the card key to get the storage identifier
    const { identifier } = parseCardKey(cardKey);
    console.log("[get-card-image] Parsed identifier:", identifier);

    // Check card_cache table first for existing image
    const { data: cacheData } = await supabase
      .from("card_cache")
      .select("image_url")
      .eq("external_id", identifier)
      .single();

    if (cacheData?.image_url) {
      console.log("[get-card-image] Found in card_cache:", cacheData.image_url);
      return new Response(
        JSON.stringify({
          imageUrl: cacheData.image_url,
          exists: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if file exists in storage
    const { data: listData } = await supabase
      .storage
      .from("card-images")
      .list("scans", {
        search: identifier,
      });

    if (listData && listData.length > 0) {
      const { data: urlData } = supabase
        .storage
        .from("card-images")
        .getPublicUrl(`scans/${listData[0].name}`);
      
      if (urlData?.publicUrl) {
        console.log("[get-card-image] Found in storage:", urlData.publicUrl);
        return new Response(
          JSON.stringify({
            imageUrl: urlData.publicUrl,
            exists: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("[get-card-image] No image found for key:", cardKey);
    return new Response(
      JSON.stringify({
        imageUrl: null,
        exists: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[get-card-image] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", imageUrl: null, exists: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
