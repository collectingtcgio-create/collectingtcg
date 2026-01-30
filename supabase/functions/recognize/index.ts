const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RecognizeResponse {
  cardName: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  confidence: number;
  game: string | null;
  ximilarId: string | null;
  error: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let imageData: string | null = null;

    // Handle multipart form data or JSON
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const imageFile = formData.get("image");
      
      if (imageFile instanceof File) {
        const buffer = await imageFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        imageData = base64;
      } else if (typeof imageFile === "string") {
        // Could be base64 string in form field
        imageData = imageFile.includes(",") ? imageFile.split(",")[1] : imageFile;
      }
    } else {
      // Assume JSON body
      const body = await req.json();
      imageData = body.image || body.image_data || body.base64;
      
      // Strip data URL prefix if present
      if (imageData && imageData.includes(",")) {
        imageData = imageData.split(",")[1];
      }
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ 
          cardName: null,
          setCode: null,
          collectorNumber: null,
          confidence: 0,
          game: null,
          ximilarId: null,
          error: "No image data provided. Send 'image' as multipart file or 'image_data'/'base64' as JSON." 
        } as RecognizeResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Ximilar API key from secrets
    const apiKey = Deno.env.get("XIMILAR_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          cardName: null,
          setCode: null,
          collectorNumber: null,
          confidence: 0,
          game: null,
          ximilarId: null,
          error: "XIMILAR_API_KEY not configured" 
        } as RecognizeResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling Ximilar API for card recognition...");

    // Call Ximilar TCG Identification API
    const ximilarResponse = await fetch("https://api.ximilar.com/tagging/collectibles/v2/tcg_id", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ _base64: imageData }],
      }),
    });

    if (!ximilarResponse.ok) {
      const errorText = await ximilarResponse.text();
      console.error("Ximilar API error:", ximilarResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          cardName: null,
          setCode: null,
          collectorNumber: null,
          confidence: 0,
          game: null,
          ximilarId: null,
          error: `Ximilar API error: ${ximilarResponse.status}` 
        } as RecognizeResponse),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ximilarData = await ximilarResponse.json();
    console.log("Ximilar response:", JSON.stringify(ximilarData).substring(0, 1000));

    // Parse Ximilar response
    const record = ximilarData.records?.[0];
    if (!record) {
      return new Response(
        JSON.stringify({ 
          cardName: null,
          setCode: null,
          collectorNumber: null,
          confidence: 0,
          game: null,
          ximilarId: null,
          error: "No recognition result from Ximilar" 
        } as RecognizeResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract card information from Ximilar's collectibles identification response
    let cardName: string | null = null;
    let setCode: string | null = null;
    let collectorNumber: string | null = null;
    let confidence = 0;
    let game: string | null = null;
    let ximilarId: string | null = null;

    // Look for card objects in the response
    const cardObject = record._objects?.find((obj: any) => 
      obj.name === "Card" || obj.Top_Category?.some((cat: any) => cat.name === "Card")
    );
    
    // Get identification data from the card object
    const identification = cardObject?._identification;
    const bestMatch = identification?.best_match;
    
    if (bestMatch) {
      cardName = bestMatch.name || bestMatch.full_name || null;
      setCode = bestMatch.set_code || bestMatch.set || null;
      collectorNumber = bestMatch.card_number || null;
      
      // Calculate confidence from distances (lower distance = higher confidence)
      const distances = identification?.distances;
      if (distances && distances.length > 0) {
        // Convert distance to confidence (distance of 0 = 100%, distance of 1 = 0%)
        confidence = Math.max(0, 1 - (distances[0] || 0.5));
      } else {
        confidence = 0.8; // Default high confidence if we have a best_match
      }
      
      // Extract game type from subcategory
      const subcategory = (bestMatch.subcategory || cardObject?._tags?.Subcategory?.[0]?.name || "").toLowerCase();
      if (subcategory.includes("pokemon")) game = "pokemon";
      else if (subcategory.includes("magic") || subcategory.includes("mtg")) game = "magic";
      else if (subcategory.includes("yugioh") || subcategory.includes("yu-gi-oh")) game = "yugioh";
      else if (subcategory.includes("one piece") || subcategory.includes("onepiece")) game = "one_piece";
      else if (subcategory.includes("dragon ball") || subcategory.includes("dragonball")) game = "dragonball";
      else if (subcategory.includes("lorcana")) game = "lorcana";
    } else {
      // Fallback: try to extract from tags
      const tags = cardObject?._tags_simple || [];
      for (const tag of tags) {
        const tagLower = tag.toLowerCase();
        if (tagLower === "pokemon") game = "pokemon";
        else if (tagLower === "magic" || tagLower === "mtg") game = "magic";
        else if (tagLower === "yugioh" || tagLower === "yu-gi-oh") game = "yugioh";
        else if (tagLower === "one piece") game = "one_piece";
        else if (tagLower === "dragon ball") game = "dragonball";
        else if (tagLower === "lorcana") game = "lorcana";
      }
      confidence = cardObject?.prob || 0;
    }

    // Extract Ximilar ID for pricing lookup
    ximilarId = record._id || cardObject?.id || null;

    const response: RecognizeResponse = {
      cardName,
      setCode,
      collectorNumber,
      confidence,
      game,
      ximilarId,
      error: null,
    };

    console.log("Recognition result:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Recognition error:", error);
    return new Response(
      JSON.stringify({ 
        cardName: null,
        setCode: null,
        collectorNumber: null,
        confidence: 0,
        game: null,
        ximilarId: null,
        error: error instanceof Error ? error.message : "Recognition failed" 
      } as RecognizeResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
