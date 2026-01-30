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

    // Call Ximilar recognition API
    const ximilarResponse = await fetch("https://api.ximilar.com/recognition/v2/classify", {
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

    // Extract card information from Ximilar response
    let cardName: string | null = null;
    let setCode: string | null = null;
    let collectorNumber: string | null = null;
    let confidence = 0;
    let game: string | null = null;
    let ximilarId: string | null = null;

    // Try multiple paths to extract data from Ximilar's response structure
    const bestLabel = record.best_label || record._objects?.[0]?.best_label;
    confidence = bestLabel?.prob || bestLabel?.confidence || record.confidence || 0;

    // Extract card name
    cardName = record.card_name 
      || record._objects?.[0]?.card_name 
      || bestLabel?.name 
      || bestLabel?.label 
      || null;

    // If cardName contains " - ", split it to get card name and set
    if (cardName && cardName.includes(" - ")) {
      const parts = cardName.split(" - ");
      cardName = parts[0]?.trim() || cardName;
      if (!setCode && parts[1]) {
        setCode = parts[1]?.trim() || null;
      }
    }

    // Extract set code
    setCode = setCode 
      || record.set_code 
      || record.set_name 
      || record._objects?.[0]?.set_code 
      || record._objects?.[0]?.set_name 
      || null;

    // Extract collector number
    collectorNumber = record.collector_number 
      || record.card_number 
      || record._objects?.[0]?.collector_number 
      || record._objects?.[0]?.card_number 
      || null;

    // Extract game type
    const gameStr = (record.game || record.category || record._objects?.[0]?.game || "").toLowerCase();
    if (gameStr.includes("pokemon")) game = "pokemon";
    else if (gameStr.includes("magic") || gameStr.includes("mtg")) game = "magic";
    else if (gameStr.includes("yugioh") || gameStr.includes("yu-gi-oh")) game = "yugioh";
    else if (gameStr.includes("one piece") || gameStr.includes("onepiece")) game = "one_piece";
    else if (gameStr.includes("dragon ball") || gameStr.includes("dragonball")) game = "dragonball";
    else if (gameStr.includes("lorcana")) game = "lorcana";

    // Extract Ximilar ID for pricing lookup
    ximilarId = record._id || record.id || record._objects?.[0]?._id || null;

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
