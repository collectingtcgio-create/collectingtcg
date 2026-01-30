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
  ocrText?: string;
}

interface CandidateCard {
  cardName: string;
  set: string | null;
  number: string | null;
  imageUrl: string | null;
  prices: { low: number | null; market: number | null; high: number | null };
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
    raw_ocr_text: result.ocrText || null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }, {
    onConflict: "game,identifier",
  });

  console.log(`Cached result for ${game}:${identifier}`);
}

// ==================== GOOGLE VISION OCR ====================

interface VisionTextAnnotation {
  description: string;
  locale?: string;
}

async function extractTextWithGoogleVision(imageData: string): Promise<{ text: string; error?: string }> {
  const apiKey = Deno.env.get("GOOGLE_VISION_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_VISION_KEY not configured");
  }

  // Extract base64 content
  const base64Content = imageData.split(",")[1] || imageData;

  console.log("Calling Google Vision API for OCR...");

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Content,
            },
            features: [
              {
                type: "TEXT_DETECTION",
                maxResults: 50,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Vision API error:", response.status, errorText);
    throw new Error(`Google Vision API failed: ${response.status}`);
  }

  const data = await response.json();
  const annotations = data.responses?.[0]?.textAnnotations as VisionTextAnnotation[] | undefined;

  if (!annotations || annotations.length === 0) {
    return { text: "", error: "No text detected in image" };
  }

  // The first annotation contains the full extracted text
  const fullText = annotations[0].description || "";
  console.log("Google Vision extracted text:", fullText.substring(0, 200));

  return { text: fullText };
}

// ==================== PARSE OCR TEXT ====================

interface ParsedCardInfo {
  cardName: string | null;
  cardNumber: string | null;
  game: GameType;
  setName: string | null;
}

function parseOcrText(ocrText: string): ParsedCardInfo {
  const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  let cardNumber: string | null = null;
  let game: GameType = null;
  let cardName: string | null = null;
  let setName: string | null = null;

  // Detect game and card number patterns
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // One Piece patterns: OP01-001, ST01-001, EB01-001, etc.
    const opMatch = upperLine.match(/\b(OP|ST|EB|PRB)\d{1,2}-\d{3,4}\b/);
    if (opMatch) {
      cardNumber = opMatch[0];
      game = "one_piece";
      continue;
    }

    // Pokemon patterns: 123/456, or set codes like SV5-001
    const pokemonMatch = upperLine.match(/\b(\d{1,3}\/\d{1,3})\b/);
    if (pokemonMatch) {
      cardNumber = pokemonMatch[0];
      game = "pokemon";
      continue;
    }

    // Dragon Ball patterns: FB01-001, BT1-001, etc.
    const dbMatch = upperLine.match(/\b(FB|BT|EX|SD|TB)\d{1,2}-\d{3,4}\b/);
    if (dbMatch) {
      cardNumber = dbMatch[0];
      game = "dragonball";
      continue;
    }
  }

  // Extract card name - typically the first 1-3 lines that look like a name
  const nameLines: string[] = [];
  for (const line of lines) {
    // Skip lines that look like set info, numbers, or game text
    if (
      /^\d+\/\d+$/.test(line) ||
      /^(OP|ST|EB|PRB|FB|BT|EX|SD|TB)\d+-\d+$/i.test(line) ||
      /^(COST|POWER|COUNTER|ATK|DEF|HP|ATTACK|RETREAT|WEAKNESS)/i.test(line) ||
      line.length > 50 ||
      /^\d+$/.test(line)
    ) {
      continue;
    }
    
    // Take first 2 lines that look like names
    if (nameLines.length < 2 && line.length >= 2) {
      nameLines.push(line);
    }
  }

  if (nameLines.length > 0) {
    cardName = nameLines.join(" ").trim();
    // Clean up common OCR artifacts
    cardName = cardName.replace(/[^\w\s\-'.,:]/g, "").trim();
  }

  return { cardName, cardNumber, game, setName };
}

// ==================== IMAGE FALLBACKS ====================

async function getOnePieceImageFallback(cardNumber: string): Promise<string | null> {
  if (!cardNumber) return null;
  
  try {
    const cleanNumber = cardNumber.replace('#', '').trim().toUpperCase();
    console.log("Trying One Piece image fallback for:", cleanNumber);
    
    // Try Limitlesstcg CDN first - most reliable source
    const limitlesstUrl = `https://limitlesstcg.nyc3.digitaloceanspaces.com/onepiece/${cleanNumber.toLowerCase()}_en.png`;
    const limitlesstResponse = await fetch(limitlesstUrl, { method: 'HEAD' });
    if (limitlesstResponse.ok) {
      console.log("Found One Piece image from limitlesstcg:", limitlesstUrl);
      return limitlesstUrl;
    }
    
    // Try onepiece-cardgame.dev API
    const response = await fetch(`https://onepiece-cardgame.dev/api/card?number=${encodeURIComponent(cleanNumber)}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.image) {
        console.log("Found One Piece image from fallback API:", data.image);
        return data.image;
      }
      if (data?.imageUrl) {
        return data.imageUrl;
      }
    }
  } catch (e) {
    console.log("One Piece image fallback failed:", e);
  }
  
  // Try constructing URL directly based on known patterns
  const patterns = [
    `https://static.dotgg.gg/onepiece/card/${cardNumber.toLowerCase()}.webp`,
    `https://images.digimoncard.io/optcg/${cardNumber.replace('-', '_').toUpperCase()}.png`,
  ];
  
  for (const url of patterns) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log("Found One Piece image at:", url);
        return url;
      }
    } catch {
      // Continue to next pattern
    }
  }
  
  return null;
}

async function getPokemonImageFallback(cardName: string, cardNumber?: string): Promise<string | null> {
  try {
    let query = `name:"${cardName}"`;
    if (cardNumber && cardNumber.includes('/')) {
      const [num] = cardNumber.split('/');
      query += ` number:${num}`;
    }
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.[0]?.images?.large) {
        console.log("Found Pokemon image from TCG API");
        return data.data[0].images.large;
      }
    }
  } catch (e) {
    console.log("Pokemon image fallback failed:", e);
  }
  return null;
}

async function getDragonBallImageFallback(cardNumber: string): Promise<string | null> {
  if (!cardNumber) return null;
  
  try {
    const cleanNumber = cardNumber.replace('#', '').trim().toUpperCase();
    console.log("Trying Dragon Ball image fallback for:", cleanNumber);
    
    // Try DBS Card Game patterns
    const patterns = [
      `https://www.dbs-cardgame.com/images/cards/${cleanNumber}.png`,
      `https://static.dotgg.gg/dragonball/card/${cleanNumber.toLowerCase()}.webp`,
    ];
    
    for (const url of patterns) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log("Found Dragon Ball image at:", url);
          return url;
        }
      } catch {
        // Continue to next pattern
      }
    }
  } catch (e) {
    console.log("Dragon Ball image fallback failed:", e);
  }
  
  return null;
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
  
  // Search by card name for better results
  const searchQuery = cardName.replace(/[^\w\s]/g, ' ').trim();
  const url = `https://api.justtcg.com/v1/cards?game=${gameSlug}&q=${encodeURIComponent(searchQuery)}&limit=15`;

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
  console.log("JustTCG raw response:", JSON.stringify(data).substring(0, 500));
  
  const rawCards = data.data || data || [];

  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    console.log("No cards found in JustTCG");
    return { cards: [], bestMatch: null };
  }

  const cards: CandidateCard[] = await Promise.all(rawCards.map(async (card: any) => {
    let priceLow: number | null = null;
    let priceMarket: number | null = null;
    let priceHigh: number | null = null;

    // Extract prices from variants
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

    // Extract image URL
    let imageUrl = card.image_url || card.image || card.images?.large || card.images?.small || card.imageUrl || null;
    const cardNum = card.number || card.card_id || card.collector_number || card.cardNumber || null;

    // Try image fallbacks if no image from JustTCG
    if (!imageUrl && cardNum) {
      if (game === "one_piece") {
        imageUrl = await getOnePieceImageFallback(cardNum);
      } else if (game === "dragonball") {
        imageUrl = await getDragonBallImageFallback(cardNum);
      }
    }
    
    if (!imageUrl && game === "pokemon") {
      imageUrl = await getPokemonImageFallback(card.name, cardNum);
    }

    return {
      cardName: card.name,
      set: card.set_name || card.set?.name || card.setName || null,
      number: cardNum,
      imageUrl,
      prices: {
        low: priceLow,
        market: priceMarket ? Math.round(priceMarket * 100) / 100 : null,
        high: priceHigh,
      },
    };
  }));

  console.log(`Found ${cards.length} cards from JustTCG`);

  // Find best match - prioritize exact card number match
  let bestMatch: CandidateCard | null = null;
  
  if (cardNumber) {
    bestMatch = cards.find(c => 
      c.number?.toUpperCase() === cardNumber.toUpperCase()
    ) || cards[0] || null;
  } else {
    // Find best name match
    const normalizedSearch = cardName.toLowerCase().replace(/[^\w]/g, '');
    bestMatch = cards.find(c => 
      c.cardName.toLowerCase().replace(/[^\w]/g, '').includes(normalizedSearch)
    ) || cards[0] || null;
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userIdentifier = user.id;
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

    // Step 1: Extract text using Google Vision OCR
    const ocrResult = await extractTextWithGoogleVision(image_data);

    if (!ocrResult.text || ocrResult.text.trim().length < 3) {
      const result: ScanResult = {
        game: null,
        cardName: null,
        set: null,
        number: null,
        imageUrl: null,
        prices: { low: null, market: null, high: null },
        confidence: 0,
        source: "live",
        error: ocrResult.error || "No text detected on card. Please ensure the card is clearly visible.",
        ocrText: ocrResult.text,
      };

      return new Response(JSON.stringify(result), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

    // Step 2: Parse OCR text to extract card info
    const parsedInfo = parseOcrText(ocrResult.text);
    console.log("Parsed card info:", parsedInfo);

    if (!parsedInfo.cardName && !parsedInfo.cardNumber) {
      const result: ScanResult = {
        game: parsedInfo.game,
        cardName: null,
        set: null,
        number: null,
        imageUrl: null,
        prices: { low: null, market: null, high: null },
        confidence: 0,
        source: "live",
        error: "Could not identify card from scanned text. Try repositioning the card.",
        ocrText: ocrResult.text,
      };

      return new Response(JSON.stringify(result), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

    const game = parsedInfo.game;
    const identifier = parsedInfo.cardNumber || parsedInfo.cardName?.toLowerCase().replace(/\s+/g, '_') || 'unknown';

    // Step 3: Check cache
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

    // Step 4: Lookup prices and images via JustTCG
    const searchTerm = parsedInfo.cardName || parsedInfo.cardNumber || "";
    const { cards, bestMatch } = await lookupJustTCG(
      game,
      searchTerm,
      parsedInfo.cardNumber
    );

    // If no results from JustTCG, try image fallbacks
    let fallbackImageUrl: string | null = null;
    if (!bestMatch && parsedInfo.cardNumber) {
      console.log("No JustTCG results, trying image fallback for:", parsedInfo.cardNumber);
      if (game === "one_piece") {
        fallbackImageUrl = await getOnePieceImageFallback(parsedInfo.cardNumber);
      } else if (game === "pokemon" && parsedInfo.cardName) {
        fallbackImageUrl = await getPokemonImageFallback(parsedInfo.cardName, parsedInfo.cardNumber);
      } else if (game === "dragonball") {
        fallbackImageUrl = await getDragonBallImageFallback(parsedInfo.cardNumber);
      }
    }

    // Build result
    const result: ScanResult = {
      game,
      cardName: bestMatch?.cardName || parsedInfo.cardName,
      set: bestMatch?.set || parsedInfo.setName || null,
      number: bestMatch?.number || parsedInfo.cardNumber || null,
      imageUrl: bestMatch?.imageUrl || fallbackImageUrl || null,
      prices: bestMatch?.prices || { low: null, market: null, high: null },
      confidence: bestMatch ? 0.9 : 0.6,
      source: "live",
      error: null,
      candidates: cards.length > 0 ? cards : undefined,
      ocrText: ocrResult.text,
    };

    // Cache the result
    if (game && identifier) {
      await setCacheResult(game, identifier, result);
    }

    console.log("Scan complete:", {
      game: result.game,
      cardName: result.cardName,
      candidatesCount: cards.length,
      hasImage: !!result.imageUrl,
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
