

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call AI to detect card boundaries
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and detect if there's a trading card game (TCG) card in it. 

Supported card types include:
- Pokémon TCG
- One Piece Card Game
- Magic: The Gathering
- Yu-Gi-Oh!
- Dragon Ball Super Card Game / Dragon Ball Z
- Disney Lorcana
- Union Arena
- Sports cards (Baseball, Basketball, Football, etc.)
- Other collectible trading cards

If a card is detected, return the crop coordinates as percentages (0-100) of the image dimensions in this exact JSON format:
{
  "detected": true,
  "cropBox": {
    "x": <left edge percentage>,
    "y": <top edge percentage>,
    "width": <width percentage>,
    "height": <height percentage>
  },
  "confidence": <0-100>,
  "cardType": "<specific type of card detected, e.g. 'Pokémon', 'Magic: The Gathering', 'Yu-Gi-Oh!', 'One Piece', 'Dragon Ball', 'Lorcana', 'Union Arena', 'Sports Card', etc.>"
}

If no card is detected, return:
{
  "detected": false,
  "message": "No trading card detected in image"
}

Only respond with valid JSON, no other text.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") 
                    ? imageBase64 
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response from AI
    let cropData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cropData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      cropData = {
        detected: false,
        message: "Could not analyze image",
      };
    }

    return new Response(JSON.stringify(cropData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to detect card";
    console.error("Error in detect-card-crop:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        detected: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
