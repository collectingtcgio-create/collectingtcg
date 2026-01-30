import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Types
type GameType = "one_piece" | "pokemon" | "dragonball" | null;

interface ScanResult {
  game: GameType;
  cardName: string | null;
  set: string | null;
  number: string | null;
  imageUrl: string | null;
  prices: { low: number | null; market: number | null; high: number | null };
  confidence: number;
  source: "cache" | "live";
  error: string | null;
  candidates?: CandidateCard[];
}

interface CandidateCard {
  cardName: string;
  set: string | null;
  number: string | null;
  imageUrl: string | null;
  prices: { low: number | null; market: number | null; high: number | null };
}

interface AICardResult {
  card_name: string;
  tcg_game: string;
  set_name?: string;
  card_number?: string;
  rarity?: string;
}

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_SCANS = 5;

// Initialize Supabase client with service role for cache/rate limit management
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ==================== RATE LIMITING ====================

async function checkRateLimit(userIdentifier: string): Promise<{ allowed: boolean; remainingScans: number }> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const { data: existing } = await supabase
    .from("scan_rate_limits")
    .select("*")
    .eq("user_identifier", userIdentifier)
    .single();

  if (!existing) {
    await supabase.from("scan_rate_limits").insert({
      user_identifier: userIdentifier,
      scan_count: 1,
      window_start: now.toISOString(),
    });
    return { allowed: true, remainingScans: RATE_LIMIT_MAX_SCANS - 1 };
  }

  const existingWindowStart = new Date(existing.window_start);

  if (existingWindowStart < windowStart) {
    await supabase
      .from("scan_rate_limits")
      .update({
        scan_count: 1,
        window_start: now.toISOString(),
      })
      .eq("user_identifier", userIdentifier);
    return { allowed: true, remainingScans: RATE_LIMIT_MAX_SCANS - 1 };
  }

  if (existing.scan_count >= RATE_LIMIT_MAX_SCANS) {
    return { allowed: false, remainingScans: 0 };
  }

  await supabase
    .from("scan_rate_limits")
    .update({ scan_count: existing.scan_count + 1 })
    .eq("user_identifier", userIdentifier);

  return { allowed: true, remainingScans: RATE_LIMIT_MAX_SCANS - existing.scan_count - 1 };
}

// ==================== CACHING ====================

async function getCachedResult(game: string, identifier: string): Promise<ScanResult | null> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("scan_cache")
    .select("*")
    .eq("game", game)
    .eq("identifier", identifier)
    .gt("expires_at", now)
    .single();

  if (!data) return null;

  console.log(`Cache hit for ${game}:${identifier}`);

  return {
    game: data.game as GameType,
    cardName: data.card_name,
    set: data.set_name,
    number: data.card_number,
    imageUrl: data.image_url,
    prices: {
      low: data.price_low,
      market: data.price_market,
      high: data.price_high,
    },
    confidence: data.confidence || 1.0,
    source: "cache",
    error: null,
    candidates: data.candidates as CandidateCard[] | undefined,
  };
}

async function setCacheResult(
  game: string,
  identifier: string,
  result: ScanResult
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from("scan_cache").upsert({
    game,
    identifier,
    card_name: result.cardName,
    set_name: result.set,
    card_number: result.number,
    image_url: result.imageUrl,
    price_low: result.prices.low,
    price_market: result.prices.market,
    price_high: result.prices.high,
    confidence: result.confidence,
    candidates: result.candidates || null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }, {
    onConflict: "game,identifier",
  });

  console.log(`Cached result for ${game}:${identifier}`);
}

// ==================== LOVABLE AI CARD IDENTIFICATION ====================

function getCardDetectionPrompt(): string {
  return `You are an expert trading card game identifier. Analyze this image and identify the trading card shown.

Supported TCGs (use exactly these values for tcg_game):
- pokemon (Pokémon TCG)
- one_piece (One Piece Card Game)
- dragonball (Dragon Ball Super Card Game)

For the card visible in the image, provide:
1. card_name: The exact card name as printed
2. tcg_game: One of: pokemon, one_piece, dragonball
3. set_name: The set/expansion name if visible
4. card_number: The card number/code if visible (e.g., OP05-119, 123/198)
5. rarity: The rarity if detectable

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
}

async function identifyCardWithAI(imageData: string): Promise<{ card: AICardResult | null; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const base64Content = imageData.split(",")[1] || imageData;
  const mimeMatch = imageData.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  console.log("Calling Lovable AI Gateway for card identification...");

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
            { type: "text", text: getCardDetectionPrompt() },
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
    return { card: null, error: "No response from AI" };
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.cards && parsed.cards.length > 0) {
        return { card: parsed.cards[0] };
      }
      return { card: null, error: parsed.error || "No card detected" };
    }
    return { card: null, error: "Could not parse AI response" };
  } catch (e) {
    console.error("JSON parse error:", e, "Content:", content);
    return { card: null, error: "Failed to parse card data" };
  }
}

// ==================== JUSTTCG API ====================

async function lookupJustTCG(
  game: GameType,
  cardName: string,
  cardNumber?: string | null
): Promise<{
  cards: CandidateCard[];
  bestMatch: CandidateCard | null;
}> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JUSTTCG_API_KEY not configured, skipping price lookup");
    return { cards: [], bestMatch: null };
  }

  const gameSlugMap: Record<string, string> = {
    one_piece: "one-piece-card-game",
    pokemon: "pokemon",
    dragonball: "dragon-ball-super-fusion-world",
  };
  
  const gameSlug = game ? gameSlugMap[game] : null;
  if (!gameSlug) {
    console.log("Unsupported game for JustTCG:", game);
    return { cards: [], bestMatch: null };
  }
  
  // Use card number for One Piece cards, otherwise use card name
  const searchQuery = game === "one_piece" && cardNumber ? cardNumber : cardName;
  const url = `https://api.justtcg.com/v1/cards?game=${gameSlug}&q=${encodeURIComponent(searchQuery)}&limit=5`;

  console.log("JustTCG API call:", url);

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("JustTCG API error:", response.status, errorText);
    return { cards: [], bestMatch: null };
  }

  const data = await response.json();
  const rawCards = data.data || data || [];

  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    console.log("No cards found in JustTCG");
    return { cards: [], bestMatch: null };
  }

  const cards: CandidateCard[] = rawCards.map((card: any) => {
    let priceLow: number | null = null;
    let priceMarket: number | null = null;
    let priceHigh: number | null = null;

    if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
      const prices = card.variants
        .map((v: any) => {
          const price = v.price ?? v.market_price ?? v.marketPrice ?? v.low_price ?? v.lowPrice;
          return typeof price === "number" ? price : parseFloat(price);
        })
        .filter((p: number) => !isNaN(p) && p > 0);
      
      if (prices.length > 0) {
        priceLow = Math.min(...prices);
        priceHigh = Math.max(...prices);
        priceMarket = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      }
    }

    const imageUrl = card.image_url || card.image || card.images?.large || card.images?.small || card.imageUrl || null;

    return {
      cardName: card.name,
      set: card.set_name || card.set?.name || card.setName || null,
      number: card.number || card.card_id || card.collector_number || card.cardNumber || null,
      imageUrl,
      prices: {
        low: priceLow,
        market: priceMarket ? Math.round(priceMarket * 100) / 100 : null,
        high: priceHigh,
      },
    };
  });

  console.log(`Found ${cards.length} cards from JustTCG`);

  // Find best match
  let bestMatch: CandidateCard | null = null;
  
  if (game === "one_piece" && cardNumber) {
    bestMatch = cards.find(c => 
      c.number?.toUpperCase() === cardNumber.toUpperCase()
    ) || cards[0] || null;
  } else {
    bestMatch = cards[0] || null;
  }

  return { cards, bestMatch };
}

// ==================== MAIN HANDLER ====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user identifier for rate limiting
    const authHeader = req.headers.get("Authorization");
    let userIdentifier = req.headers.get("x-forwarded-for") || "anonymous";
    
    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      if (claimsData?.claims?.sub) {
        userIdentifier = claimsData.claims.sub;
      }
    }

    // Check rate limit
    const { allowed, remainingScans } = await checkRateLimit(userIdentifier);
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Scan limit reached. Please wait.",
          remainingScans: 0,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
          } 
        }
      );
    }

    const body = await req.json();
    const { image_data } = body;

    if (!image_data) {
      return new Response(
        JSON.stringify({ error: "image_data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Identify card using Lovable AI
    const aiResult = await identifyCardWithAI(image_data);

    if (!aiResult.card) {
      const result: ScanResult = {
        game: null,
        cardName: null,
        set: null,
        number: null,
        imageUrl: null,
        prices: { low: null, market: null, high: null },
        confidence: 0,
        source: "live",
        error: aiResult.error || "No trading card detected in image. Please ensure the card is clearly visible.",
      };

      return new Response(JSON.stringify(result), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

    const identifiedCard = aiResult.card;
    const game = identifiedCard.tcg_game as GameType;
    const identifier = identifiedCard.card_number || identifiedCard.card_name.toLowerCase().replace(/\s+/g, '_');

    console.log("AI identified card:", identifiedCard);

    // Step 2: Check cache
    if (game && identifier) {
      const cachedResult = await getCachedResult(game, identifier);
      if (cachedResult) {
        return new Response(JSON.stringify(cachedResult), {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": remainingScans.toString(),
          },
        });
      }
    }

    // Step 3: Lookup prices and images via JustTCG
    const { cards, bestMatch } = await lookupJustTCG(
      game,
      identifiedCard.card_name,
      identifiedCard.card_number
    );

    // Build result
    const result: ScanResult = {
      game,
      cardName: bestMatch?.cardName || identifiedCard.card_name,
      set: bestMatch?.set || identifiedCard.set_name || null,
      number: bestMatch?.number || identifiedCard.card_number || null,
      imageUrl: bestMatch?.imageUrl || null,
      prices: bestMatch?.prices || { low: null, market: null, high: null },
      confidence: 0.9,
      source: "live",
      error: null,
      candidates: cards.length > 1 ? cards.slice(0, 5) : undefined,
    };

    // Cache the result
    if (game && identifier) {
      await setCacheResult(game, identifier, result);
    }

    console.log("Scan complete:", {
      game: result.game,
      cardName: result.cardName,
      candidatesCount: cards.length,
    });

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": remainingScans.toString(),
      },
    });

  } catch (error) {
    console.error("Scan error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Scan failed";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        game: null,
        cardName: null,
        set: null,
        number: null,
        imageUrl: null,
        prices: { low: null, market: null, high: null },
        confidence: 0,
        source: "live",
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
