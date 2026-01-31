import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a unique identifier for a card based on its properties
function generateCardIdentifier(game: string, cardName: string, setName?: string | null, cardNumber?: string | null): string {
  const parts = [
    game.toLowerCase().replace(/\s+/g, '_'),
    cardName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
  ];
  
  if (setName) {
    parts.push(setName.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  }
  
  if (cardNumber) {
    parts.push(cardNumber.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  }
  
  return parts.join('__');
}

// Check if an image already exists for this card
async function getExistingImage(
  supabase: any,
  identifier: string
): Promise<string | null> {
  // Check card_cache table first for existing image
  const { data: cacheData } = await supabase
    .from("card_cache")
    .select("image_url")
    .eq("external_id", identifier)
    .single();

  if (cacheData?.image_url) {
    console.log(`Found existing image in cache for: ${identifier}`);
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
      console.log(`Found existing image in storage for: ${identifier}`);
      return urlData.publicUrl;
    }
  }

  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, game, cardName, setName, cardNumber } = await req.json();

    // Validate required fields
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cardName) {
      return new Response(
        JSON.stringify({ error: "cardName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!game) {
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
    const identifier = generateCardIdentifier(game, cardName, setName, cardNumber);
    
    // Create a readable title
    const title = cardName + (setName ? ` (${setName})` : "") + (cardNumber ? ` #${cardNumber}` : "");

    // Check if image already exists
    const existingUrl = await getExistingImage(supabase, identifier);
    
    if (existingUrl) {
      console.log(`Returning existing image for: ${identifier}`);
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

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("card-images")
      .upload(filename, bytes, {
        contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
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

    console.log(`Image saved successfully: ${imageUrl}`);

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
    console.error("save-scan-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
