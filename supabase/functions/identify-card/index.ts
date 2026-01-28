import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type TcgGame = 'pokemon' | 'magic' | 'yugioh' | 'onepiece' | 'dragonball' | 'lorcana' | 'unionarena';

interface CardResult {
  card_name: string;
  tcg_game: TcgGame;
  set_name?: string;
  rarity?: string;
  card_number?: string;
  image_url: string | null;
  price_estimate: number | null;
  confidence?: number;
}

interface ApiResponse {
  success: boolean;
  cards?: CardResult[];
  error?: string;
  processing_time_ms?: number;
}

const TCG_DETECTION_PROMPT = `You are an expert trading card game identifier. Analyze this image and identify the trading card(s) shown.

Supported TCGs:
- pokemon (Pokémon TCG)
- magic (Magic: The Gathering)
- yugioh (Yu-Gi-Oh!)
- onepiece (One Piece Card Game)
- dragonball (Dragon Ball Super Card Game)
- lorcana (Disney Lorcana)
- unionarena (Union Arena)

For each card visible in the image, provide:
1. card_name: The exact card name as printed
2. tcg_game: One of the supported game identifiers above
3. set_name: The set/expansion name if visible
4. card_number: The card number/code if visible
5. rarity: The rarity (common, uncommon, rare, ultra rare, secret rare, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "cards": [
    {
      "card_name": "Card Name Here",
      "tcg_game": "pokemon",
      "set_name": "Set Name",
      "card_number": "123/456",
      "rarity": "Rare"
    }
  ]
}

If no trading card is detected, respond with:
{"cards": [], "error": "No trading card detected in image"}`;

async function identifyWithAI(imageData: string): Promise<{ cards: any[]; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Extract base64 content from data URL
  const base64Content = imageData.split(",")[1] || imageData;
  const mimeMatch = imageData.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: TCG_DETECTION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Content}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    throw new Error(`AI identification failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return { cards: [], error: "No response from AI" };
  }

  // Parse JSON from response
  try {
    // Try to extract JSON from the response (AI might include markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { 
        cards: parsed.cards || [], 
        error: parsed.error 
      };
    }
    return { cards: [], error: "Could not parse AI response" };
  } catch (e) {
    console.error("JSON parse error:", e, "Content:", content);
    return { cards: [], error: "Failed to parse card data" };
  }
}

// Fetch card details and pricing from our fetch-card-data function
async function enrichCardData(
  cards: any[],
  supabaseUrl: string,
  authHeader: string
): Promise<CardResult[]> {
  const enrichedCards: CardResult[] = [];

  for (const card of cards) {
    try {
      // Search our cache/APIs for this card
      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-card-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: card.card_name,
          tcg_game: card.tcg_game,
          limit: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedCard = data.cards?.[0];

        if (fetchedCard) {
          enrichedCards.push({
            card_name: fetchedCard.card_name || card.card_name,
            tcg_game: fetchedCard.tcg_game || card.tcg_game,
            set_name: fetchedCard.set_name || card.set_name,
            rarity: fetchedCard.rarity || card.rarity,
            card_number: fetchedCard.card_number || card.card_number,
            image_url: fetchedCard.image_url || null,
            price_estimate: fetchedCard.price_market || fetchedCard.price_mid || null,
            confidence: 0.9,
          });
          continue;
        }
      }
    } catch (e) {
      console.error("Error enriching card data:", e);
    }

    // Fallback: return what we got from AI
    enrichedCards.push({
      card_name: card.card_name,
      tcg_game: card.tcg_game,
      set_name: card.set_name,
      rarity: card.rarity,
      card_number: card.card_number,
      image_url: null,
      price_estimate: null,
      confidence: 0.7,
    });
  }

  return enrichedCards;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { image_data } = body;

    if (!image_data) {
      return new Response(
        JSON.stringify({ success: false, error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!image_data.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image format. Expected base64 data URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to identify the card
    console.log("Starting AI card identification...");
    const aiResult = await identifyWithAI(image_data);

    if (aiResult.error && aiResult.cards.length === 0) {
      const processingTime = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: false,
          error: aiResult.error,
          processing_time_ms: processingTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (aiResult.cards.length === 0) {
      const processingTime = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: false,
          error: "No card detected in image",
          processing_time_ms: processingTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich with database info and pricing
    console.log(`AI identified ${aiResult.cards.length} cards, enriching...`);
    const enrichedCards = await enrichCardData(aiResult.cards, supabaseUrl, authHeader);

    const processingTime = Date.now() - startTime;

    const response: ApiResponse = {
      success: true,
      cards: enrichedCards,
      processing_time_ms: processingTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in identify-card function:", error);
    
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        processing_time_ms: processingTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
