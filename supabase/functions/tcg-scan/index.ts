import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Types
interface ScanResult {
  game: "one_piece" | "pokemon" | null;
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

interface OCRResult {
  fullText: string;
  game: "one_piece" | "pokemon" | null;
  identifier: string | null;
  cardName: string | null;
  collectorNumber: string | null;
  confidence: number;
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

  // Get current rate limit record
  const { data: existing } = await supabase
    .from("scan_rate_limits")
    .select("*")
    .eq("user_identifier", userIdentifier)
    .single();

  if (!existing) {
    // First scan for this user
    await supabase.from("scan_rate_limits").insert({
      user_identifier: userIdentifier,
      scan_count: 1,
      window_start: now.toISOString(),
    });
    return { allowed: true, remainingScans: RATE_LIMIT_MAX_SCANS - 1 };
  }

  const existingWindowStart = new Date(existing.window_start);

  if (existingWindowStart < windowStart) {
    // Window has expired, reset
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

  // Increment scan count
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
    game: data.game as "one_piece" | "pokemon",
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
  result: ScanResult,
  rawOcrText?: string
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
    raw_ocr_text: rawOcrText,
    candidates: result.candidates || null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  }, {
    onConflict: "game,identifier",
  });

  console.log(`Cached result for ${game}:${identifier}`);
}

// ==================== IMAGE PREPROCESSING ====================

async function preprocessImage(base64Image: string): Promise<string> {
  // For now, return the image as-is
  // In production, you would:
  // 1. Decode the base64 image
  // 2. Detect card bounds and crop
  // 3. Deskew/straighten
  // 4. Increase contrast / reduce glare
  // 5. Re-encode to base64
  
  // This would require a proper image processing library
  // For now, we trust the user's crop or the detect-card-crop function
  return base64Image;
}

// ==================== GOOGLE CLOUD VISION OCR ====================

async function performOCR(imageBase64: string): Promise<OCRResult> {
  const apiKey = Deno.env.get("GOOGLE_VISION_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_VISION_KEY not configured");
  }

  // Clean base64 data
  const base64Content = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64;

  const requestBody = {
    requests: [
      {
        image: {
          content: base64Content,
        },
        features: [
          {
            type: "DOCUMENT_TEXT_DETECTION",
          },
        ],
      },
    ],
  };

  console.log("Calling Google Cloud Vision API...");

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Vision API error:", response.status, errorText);
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const fullText = data.responses?.[0]?.fullTextAnnotation?.text || "";

  console.log("OCR full text:", fullText.substring(0, 500) + "...");

  // Parse the OCR text
  return parseOCRText(fullText);
}

function parseOCRText(fullText: string): OCRResult {
  const result: OCRResult = {
    fullText,
    game: null,
    identifier: null,
    cardName: null,
    collectorNumber: null,
    confidence: 0,
  };

  // Step 1: Try to detect One Piece card code
  // Patterns: OP05-119, EB01-001, ST01-001
  const onePieceRegex = /\b(OP|EB|ST)\d{2}-\d{3}\b/i;
  const onePieceMatch = fullText.match(onePieceRegex);

  if (onePieceMatch) {
    result.game = "one_piece";
    result.identifier = onePieceMatch[0].toUpperCase();
    result.collectorNumber = result.identifier;
    result.confidence = 0.95;
    console.log("Detected One Piece card:", result.identifier);
    return result;
  }

  // Step 2: Try to detect Pokémon signals
  const pokemonSignals = ["pokémon", "pokemon", "basic", "trainer", "stage 1", "stage 2", "vmax", "vstar", "ex", "gx", "v-union"];
  const textLower = fullText.toLowerCase();
  const hasPokemonSignal = pokemonSignals.some(signal => textLower.includes(signal));

  // Also check for HP pattern which is common in Pokémon cards
  const hpPattern = /\b\d{2,3}\s*hp\b/i;
  const hasHP = hpPattern.test(fullText);

  if (hasPokemonSignal || hasHP) {
    result.game = "pokemon";
    
    // Extract collector number patterns: 123/198, TG12/TG30, etc.
    const collectorPatterns = [
      /\b(\d{1,3})\/(\d{1,3})\b/, // Standard: 123/198
      /\b([A-Z]{1,3}\d{1,3})\/([A-Z]{1,3}\d{1,3})\b/, // Trainer Gallery: TG12/TG30
      /\b(\d{1,3})\/([A-Z]+\d{1,3})\b/, // Mixed: 001/SV123
    ];

    for (const pattern of collectorPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.collectorNumber = match[0];
        break;
      }
    }

    // Extract card name (usually the most prominent text near the top)
    // Look for name patterns - typically before "HP" or at the start
    const lines = fullText.split(/\n/).filter(line => line.trim().length > 0);
    
    // The card name is usually on the first few lines
    for (const line of lines.slice(0, 5)) {
      const trimmedLine = line.trim();
      // Skip lines that are just numbers, HP values, or very short
      if (trimmedLine.length > 2 && 
          !/^\d+$/.test(trimmedLine) && 
          !/^\d+\s*hp$/i.test(trimmedLine) &&
          !trimmedLine.toLowerCase().includes('basic') &&
          !trimmedLine.toLowerCase().includes('stage')) {
        result.cardName = trimmedLine;
        break;
      }
    }

    // Build identifier for caching
    if (result.cardName && result.collectorNumber) {
      result.identifier = `${result.cardName.toLowerCase().replace(/\s+/g, '_')}_${result.collectorNumber.replace('/', '-')}`;
      result.confidence = 0.85;
    } else if (result.cardName) {
      result.identifier = result.cardName.toLowerCase().replace(/\s+/g, '_');
      result.confidence = 0.7;
    } else if (result.collectorNumber) {
      result.identifier = result.collectorNumber.replace('/', '-');
      result.confidence = 0.6;
    }

    console.log("Detected Pokémon card:", result.cardName, result.collectorNumber);
    return result;
  }

  // No game detected
  result.confidence = 0;
  console.log("No TCG card detected in OCR text");
  return result;
}

// ==================== JUSTTCG API ====================

async function lookupJustTCG(
  game: "one_piece" | "pokemon",
  identifier: string,
  cardName?: string | null
): Promise<{
  cards: CandidateCard[];
  bestMatch: CandidateCard | null;
}> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    throw new Error("JUSTTCG_API_KEY not configured");
  }

  const gameSlug = game === "one_piece" ? "one-piece-card-game" : "pokemon";
  
  // Build search query
  let searchQuery = identifier;
  if (game === "pokemon" && cardName) {
    // For Pokémon, search by name primarily
    searchQuery = cardName;
  }

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
    throw new Error(`JustTCG API error: ${response.status}`);
  }

  const data = await response.json();
  const rawCards = data.data || data || [];

  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    console.log("No cards found in JustTCG");
    return { cards: [], bestMatch: null };
  }

  const cards: CandidateCard[] = rawCards.map((card: any) => {
    // Extract prices from variants
    let priceLow: number | null = null;
    let priceMarket: number | null = null;
    let priceHigh: number | null = null;

    if (card.variants && Array.isArray(card.variants)) {
      const prices = card.variants
        .map((v: any) => v.price)
        .filter((p: any) => typeof p === "number" && p > 0);
      
      if (prices.length > 0) {
        priceLow = Math.min(...prices);
        priceHigh = Math.max(...prices);
        priceMarket = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      }
    }

    return {
      cardName: card.name,
      set: card.set?.name || card.setName || null,
      number: card.card_id || card.number || card.collector_number || null,
      imageUrl: card.image_url || card.image || card.images?.large || card.images?.small || null,
      prices: {
        low: priceLow,
        market: priceMarket,
        high: priceHigh,
      },
    };
  });

  console.log(`Found ${cards.length} cards from JustTCG`);

  // For One Piece, try exact code match
  let bestMatch: CandidateCard | null = null;
  
  if (game === "one_piece") {
    bestMatch = cards.find(c => 
      c.number?.toUpperCase() === identifier.toUpperCase()
    ) || cards[0] || null;
  } else {
    // For Pokémon, best match is first result (most relevant by API)
    bestMatch = cards[0] || null;
  }

  return { cards, bestMatch };
}

// ==================== MAIN HANDLER ====================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST
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

    // Parse request body
    const body = await req.json();
    const { image_data } = body;

    if (!image_data) {
      return new Response(
        JSON.stringify({ error: "image_data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Preprocess image
    const processedImage = await preprocessImage(image_data);

    // Step 2: Perform OCR with Google Cloud Vision
    const ocrResult = await performOCR(processedImage);

    if (!ocrResult.game || !ocrResult.identifier) {
      // No card detected
      const result: ScanResult = {
        game: null,
        cardName: null,
        set: null,
        number: null,
        imageUrl: null,
        prices: { low: null, market: null, high: null },
        confidence: 0,
        source: "live",
        error: "No trading card detected in image. Please ensure the card is clearly visible.",
      };

      return new Response(JSON.stringify(result), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

    // Step 3: Check cache
    const cachedResult = await getCachedResult(ocrResult.game, ocrResult.identifier);
    if (cachedResult) {
      return new Response(JSON.stringify(cachedResult), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

    // Step 4: Lookup card via JustTCG
    const { cards, bestMatch } = await lookupJustTCG(
      ocrResult.game,
      ocrResult.identifier,
      ocrResult.cardName
    );

    if (!bestMatch) {
      // No match found
      const result: ScanResult = {
        game: ocrResult.game,
        cardName: ocrResult.cardName,
        set: null,
        number: ocrResult.identifier,
        imageUrl: null,
        prices: { low: null, market: null, high: null },
        confidence: ocrResult.confidence,
        source: "live",
        error: "Card not found. The card may be new or not yet in the database.",
      };

      return new Response(JSON.stringify(result), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

    // Build successful result
    const result: ScanResult = {
      game: ocrResult.game,
      cardName: bestMatch.cardName,
      set: bestMatch.set,
      number: bestMatch.number,
      imageUrl: bestMatch.imageUrl,
      prices: bestMatch.prices,
      confidence: ocrResult.confidence,
      source: "live",
      error: null,
      // Include candidates if multiple matches for user confirmation
      candidates: cards.length > 1 ? cards.slice(0, 5) : undefined,
    };

    // Cache the result
    await setCacheResult(ocrResult.game, ocrResult.identifier, result, ocrResult.fullText);

    console.log("Scan complete:", {
      game: result.game,
      cardName: result.cardName,
      cacheHit: false,
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
