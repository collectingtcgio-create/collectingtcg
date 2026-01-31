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

// Generate a unique identifier for a card based on its properties
function generateCardIdentifier(
  game: string,
  cardName: string,
  setName?: string | null,
  cardNumber?: string | null,
  productId?: string | null
): string {
  // If we have a stable productId from pricing API, use it as the canonical key
  if (productId) {
    const key = `${normalizeForKey(game)}__pid__${productId}`;
    console.log("[card_key] Using productId-based key:", key);
    return key;
  }
  
  // Otherwise build a normalized key from card attributes
  const parts = [
    normalizeForKey(game),
    normalizeForKey(cardName),
  ];
  
  if (setName) {
    parts.push(normalizeForKey(setName));
  }
  
  if (cardNumber) {
    parts.push(normalizeForKey(cardNumber));
  }
  
  const key = parts.join('__');
  console.log("[card_key] Generated normalized key:", key);
  return key;
}

// Check if an image already exists for this card
async function getExistingImage(
  supabase: any,
  identifier: string
): Promise<string | null> {
  console.log("[getExistingImage] Checking for existing image:", identifier);
  
  // Check card_cache table first for existing image
  const { data: cacheData } = await supabase
    .from("card_cache")
    .select("image_url")
    .eq("external_id", identifier)
    .single();

  if (cacheData?.image_url) {
    console.log("[getExistingImage] Found in card_cache:", cacheData.image_url);
    return cacheData.image_url;
  }

  // Also check if file exists in storage
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
      console.log("[getExistingImage] Found in storage:", urlData.publicUrl);
      return urlData.publicUrl;
    }
  }

  console.log("[getExistingImage] No existing image found");
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[save-scan-image] Function invoked");

  try {
    const { imageBase64, game, cardName, setName, cardNumber, productId } = await req.json();

    console.log("[save-scan-image] Request received:");
    console.log("[save-scan-image]   game:", game);
    console.log("[save-scan-image]   cardName:", cardName);
    console.log("[save-scan-image]   setName:", setName || "null");
    console.log("[save-scan-image]   cardNumber:", cardNumber || "null");
    console.log("[save-scan-image]   productId:", productId || "null");
    console.log("[save-scan-image]   imageBase64 length:", imageBase64?.length || 0);

    // Validate required fields
    if (!imageBase64) {
      console.log("[save-scan-image] Error: imageBase64 is required");
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cardName) {
      console.log("[save-scan-image] Error: cardName is required");
      return new Response(
        JSON.stringify({ error: "cardName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!game) {
      console.log("[save-scan-image] Error: game is required");
      return new Response(
        JSON.stringify({ error: "game is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for storage operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate unique identifier for this card
    const identifier = generateCardIdentifier(game, cardName, setName, cardNumber, productId);
    
    // Create a readable title
    const title = cardName + (setName ? ` (${setName})` : "") + (cardNumber ? ` #${cardNumber}` : "");

    console.log("[save-scan-image] Generated identifier:", identifier);
    console.log("[save-scan-image] Generated title:", title);

    // Check if image already exists
    const existingUrl = await getExistingImage(supabase, identifier);
    
    if (existingUrl) {
      console.log("[save-scan-image] Returning cached image:", existingUrl);
      return new Response(
        JSON.stringify({
          imageUrl: existingUrl,
          title,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 content (remove data URL prefix if present)
    const base64Content = imageBase64.includes(",") 
      ? imageBase64.split(",")[1] 
      : imageBase64;

    // Determine file extension from data URL or default to jpg
    let extension = "jpg";
    const mimeMatch = imageBase64.match(/data:image\/(\w+);/);
    if (mimeMatch) {
      extension = mimeMatch[1] === "jpeg" ? "jpg" : mimeMatch[1];
    }

    // Convert base64 to Uint8Array for upload
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate filename
    const filename = `scans/${identifier}.${extension}`;
    console.log("[save-scan-image] Uploading to:", filename);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("card-images")
      .upload(filename, bytes, {
        contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("[save-scan-image] Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: `Failed to upload image: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from("card-images")
      .getPublicUrl(filename);

    const imageUrl = urlData.publicUrl;

    console.log("[save-scan-image] Image saved successfully:", imageUrl);

    // Return success response
    return new Response(
      JSON.stringify({
        imageUrl,
        title,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[save-scan-image] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
