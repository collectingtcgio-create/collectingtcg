import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Types - Extended to support more games
type GameType = "one_piece" | "pokemon" | "dragonball" | "yugioh" | "magic" | "lorcana" | "non_game" | null;

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

// ==================== XIMILAR API - Card Recognition ====================

interface XimilarRecognitionResult {
  cardName: string | null;
  set: string | null;
  confidence: number;
  game: GameType;
  ocrText?: string;
}

async function recognizeCardWithXimilar(imageData: string): Promise<XimilarRecognitionResult> {
  const apiKey = Deno.env.get("XIMILAR_API_KEY");
  if (!apiKey) {
    console.log("XIMILAR_API_KEY not configured, falling back to Google Vision OCR");
    // Fallback to Google Vision if Ximilar not configured
    return { cardName: null, set: null, confidence: 0, game: null };
  }

  // Extract base64 content - Ximilar expects base64 without the data URL prefix
  const base64Content = imageData.split(",")[1] || imageData;

  console.log("Calling Ximilar API for card recognition...");

  try {
    const response = await fetch("https://api.ximilar.com/recognition/v2/classify", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            _base64: base64Content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ximilar API error:", response.status, errorText);
      return { cardName: null, set: null, confidence: 0, game: null };
    }

    const data = await response.json();
    console.log("Ximilar response:", JSON.stringify(data).substring(0, 500));

    // Parse Ximilar response - structure depends on the specific task/model
    const record = data.records?.[0];
    if (!record) {
      console.log("No records in Ximilar response");
      return { cardName: null, set: null, confidence: 0, game: null };
    }

    // Extract best prediction
    const bestLabel = record.best_label || record._objects?.[0]?.best_label;
    const confidence = bestLabel?.prob || bestLabel?.confidence || 0;
    const labelName = bestLabel?.name || bestLabel?.label || "";

    // Try to extract card name and set from the label
    let cardName: string | null = null;
    let setName: string | null = null;
    let game: GameType = null;

    // Ximilar might return structured data or just a label
    if (record.card_name) {
      cardName = record.card_name;
    } else if (record._objects?.[0]?.card_name) {
      cardName = record._objects[0].card_name;
    } else if (labelName) {
      // Parse the label name - might be in format "CardName - SetName" or just "CardName"
      const parts = labelName.split(" - ");
      cardName = parts[0]?.trim() || labelName;
      if (parts.length > 1) {
        setName = parts[1]?.trim() || null;
      }
    }

    // Try to detect game from labels or categories
    if (record.game || record.category) {
      const gameStr = (record.game || record.category || "").toLowerCase();
      if (gameStr.includes("pokemon")) game = "pokemon";
      else if (gameStr.includes("magic") || gameStr.includes("mtg")) game = "magic";
      else if (gameStr.includes("yugioh") || gameStr.includes("yu-gi-oh")) game = "yugioh";
      else if (gameStr.includes("one piece") || gameStr.includes("onepiece")) game = "one_piece";
      else if (gameStr.includes("dragon ball") || gameStr.includes("dragonball")) game = "dragonball";
      else if (gameStr.includes("lorcana")) game = "lorcana";
    }

    // Extract set if available
    if (record.set_name) {
      setName = record.set_name;
    } else if (record._objects?.[0]?.set_name) {
      setName = record._objects[0].set_name;
    }

    // Get OCR text if Ximilar provides it
    const ocrText = record.ocr_text || record._objects?.[0]?.ocr_text || "";

    console.log("Ximilar recognition result:", { cardName, setName, confidence, game });

    return {
      cardName,
      set: setName,
      confidence,
      game,
      ocrText,
    };
  } catch (error) {
    console.error("Ximilar recognition error:", error);
    return { cardName: null, set: null, confidence: 0, game: null };
  }
}

// ==================== GOOGLE VISION OCR (Fallback) ====================

interface VisionTextAnnotation {
  description: string;
  locale?: string;
}

async function extractTextWithGoogleVision(imageData: string): Promise<{ text: string; error?: string }> {
  const apiKey = Deno.env.get("GOOGLE_VISION_KEY");
  if (!apiKey) {
    console.log("GOOGLE_VISION_KEY not configured");
    return { text: "", error: "GOOGLE_VISION_KEY not configured" };
  }

  // Extract base64 content
  const base64Content = imageData.split(",")[1] || imageData;

  console.log("Calling Google Vision API for OCR...");

  try {
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
      return { text: "", error: `Google Vision API failed: ${response.status}` };
    }

    const data = await response.json();
    const annotations = data.responses?.[0]?.textAnnotations as VisionTextAnnotation[] | undefined;

    if (!annotations || annotations.length === 0) {
      return { text: "", error: "No text detected in image" };
    }

    // The first annotation contains the full extracted text
    const fullText = annotations[0].description || "";
    console.log("Google Vision extracted text:", fullText.substring(0, 300));

    return { text: fullText };
  } catch (error) {
    console.error("Google Vision error:", error);
    return { text: "", error: "Google Vision request failed" };
  }
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
  const fullText = ocrText.toUpperCase();
  
  let cardNumber: string | null = null;
  let game: GameType = null;
  let cardName: string | null = null;
  let setName: string | null = null;

  // Detect game and card number patterns
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // One Piece patterns: OP01-001, ST01-001, EB01-001, PRB-001
    const opMatch = upperLine.match(/\b(OP|ST|EB|PRB)\d{1,2}-\d{3,4}\b/);
    if (opMatch) {
      cardNumber = opMatch[0];
      game = "one_piece";
      continue;
    }

    // Yu-Gi-Oh patterns: Various set codes like PHNI-EN001, LOB-001, SDCS-EN043
    const yugiohMatch = upperLine.match(/\b([A-Z]{2,4})-([A-Z]{2})?(\d{3,4})\b/);
    if (yugiohMatch && !game) {
      const prefix = yugiohMatch[1];
      // Common Yu-Gi-Oh set prefixes
      const yugiohPrefixes = ['LOB', 'MRD', 'MRL', 'PSV', 'LON', 'MFC', 'DCR', 'IOC', 'AST', 'SOD', 
        'RDS', 'FET', 'TLM', 'CRV', 'EEN', 'SOI', 'EOJ', 'POTD', 'CDIP', 'STON', 'FOTB', 'TAEV',
        'PHNI', 'LEDE', 'BLMR', 'PHHY', 'CYAC', 'DUNE', 'AGOV', 'LART', 'RA01', 'MAMA', 'GFP2',
        'MZMI', 'SDCS', 'BROL', 'KICO', 'DAMA', 'DIFO', 'POTE', 'DABL', 'PHSW', 'ORCS', 'GAOV',
        'REDU', 'ABYR', 'CBLZ', 'LTGY', 'JOTL', 'SHSP', 'LVAL', 'PRIO', 'DUEA', 'NECH', 'SECE',
        'CROS', 'CORE', 'DOCS', 'BOSH', 'SHVI', 'TDIL', 'INOV', 'RATE', 'MACR', 'COTD', 'CIBR',
        'EXFO', 'FLOD', 'CYHO', 'SOFU', 'SAST', 'DANE', 'RIRA', 'CHIM', 'IGAS', 'ETCO', 'ROTD',
        'PHRA', 'BLVO', 'LIOV', 'DAMA', 'BODE', 'BACH', 'GRCR', 'POTE', 'DIFO'];
      if (yugiohPrefixes.includes(prefix)) {
        cardNumber = yugiohMatch[0];
        game = "yugioh";
        continue;
      }
    }

    // Magic: The Gathering - Set codes are typically 3 letters
    // Look for patterns like "001/287" with set context
    if (!game && (fullText.includes('MAGIC') || fullText.includes('WIZARDS') || 
        fullText.includes('MANA') || fullText.includes('CREATURE') || 
        fullText.includes('INSTANT') || fullText.includes('SORCERY') ||
        fullText.includes('ENCHANTMENT') || fullText.includes('ARTIFACT') ||
        fullText.includes('PLANESWALKER') || fullText.includes('LAND'))) {
      game = "magic";
      // MTG collector number pattern
      const mtgMatch = upperLine.match(/\b(\d{1,3})\/(\d{2,3})\b/);
      if (mtgMatch) {
        cardNumber = mtgMatch[0];
      }
    }

    // Pokemon patterns: 123/456, or set codes like SV5-001
    const pokemonMatch = upperLine.match(/\b(\d{1,3}\/\d{1,3})\b/);
    if (pokemonMatch && !game) {
      cardNumber = pokemonMatch[0];
      game = "pokemon";
      continue;
    }

    // Dragon Ball patterns: FB01-001, BT1-001, etc.
    const dbMatch = upperLine.match(/\b(FB|BT|EX|SD|TB|P|FS)\d{1,2}-\d{3,4}\b/);
    if (dbMatch) {
      cardNumber = dbMatch[0];
      game = "dragonball";
      continue;
    }

    // Lorcana patterns: Look for set numbers like 1/204
    if (!game && (fullText.includes('LORCANA') || fullText.includes('DISNEY') || 
        fullText.includes('INKWELL') || fullText.includes('STORYBORN'))) {
      game = "lorcana";
      const lorcanaMatch = upperLine.match(/\b(\d{1,3}\/\d{2,3})\b/);
      if (lorcanaMatch) {
        cardNumber = lorcanaMatch[0];
      }
    }
  }

  // If still no game detected, try broader heuristics
  if (!game) {
    // Check for sports/non-game cards
    if (fullText.includes('TOPPS') || fullText.includes('PANINI') || 
        fullText.includes('UPPER DECK') || fullText.includes('BASEBALL') ||
        fullText.includes('BASKETBALL') || fullText.includes('FOOTBALL') ||
        fullText.includes('HOCKEY') || fullText.includes('NASCAR') ||
        fullText.includes('MARVEL') || fullText.includes('STAR WARS')) {
      game = "non_game";
    }
  }

  // Extract card name - typically the first 1-3 lines that look like a name
  const nameLines: string[] = [];
  for (const line of lines) {
    // Skip lines that look like set info, numbers, or game text
    if (
      /^\d+\/\d+$/.test(line) ||
      /^(OP|ST|EB|PRB|FB|BT|EX|SD|TB)\d+-\d+$/i.test(line) ||
      /^[A-Z]{2,4}-[A-Z]{0,2}\d{3,4}$/i.test(line) ||
      /^(COST|POWER|COUNTER|ATK|DEF|HP|ATTACK|RETREAT|WEAKNESS)/i.test(line) ||
      /^(CREATURE|INSTANT|SORCERY|ENCHANTMENT|ARTIFACT)/i.test(line) ||
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
    cardName = cardName.replace(/[^\w\s\-'.,:&]/g, "").trim();
  }

  return { cardName, cardNumber, game, setName };
}

// ==================== IMAGE FALLBACKS ====================

async function getOnePieceImageFallback(cardNumber: string): Promise<string | null> {
  if (!cardNumber) return null;
  
  try {
    const cleanNumber = cardNumber.replace('#', '').trim().toUpperCase();
    console.log("Trying One Piece image fallback for:", cleanNumber);
    
    // Try multiple sources for One Piece images
    const sources = [
      // LimitlessTCG CDN - most reliable
      `https://limitlesstcg.nyc3.digitaloceanspaces.com/onepiece/${cleanNumber.toLowerCase()}_en.png`,
      // Alternative formats
      `https://limitlesstcg.nyc3.digitaloceanspaces.com/onepiece/${cleanNumber.toUpperCase()}.png`,
      // dotgg format
      `https://static.dotgg.gg/onepiece/card/${cleanNumber.toLowerCase()}.webp`,
    ];
    
    for (const url of sources) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log("Found One Piece image at:", url);
          return url;
        }
      } catch {
        // Continue to next source
      }
    }
    
    // Try onepiece-cardgame.dev API as last resort
    const response = await fetch(`https://onepiece-cardgame.dev/api/card?number=${encodeURIComponent(cleanNumber)}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.image || data?.imageUrl) {
        console.log("Found One Piece image from API");
        return data.image || data.imageUrl;
      }
    }
  } catch (e) {
    console.log("One Piece image fallback failed:", e);
  }
  
  return null;
}

async function getYuGiOhImageFallback(cardName: string, cardNumber?: string | null): Promise<string | null> {
  try {
    console.log("Trying Yu-Gi-Oh image fallback for:", cardName);
    
    // Use YGOProDeck API for images
    const query = cardName.replace(/[^\w\s]/g, ' ').trim();
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.[0]?.card_images?.[0]?.image_url) {
        console.log("Found Yu-Gi-Oh image from YGOProDeck");
        return data.data[0].card_images[0].image_url;
      }
    }
  } catch (e) {
    console.log("Yu-Gi-Oh image fallback failed:", e);
  }
  return null;
}

async function getMagicImageFallback(cardName: string): Promise<string | null> {
  try {
    console.log("Trying MTG image fallback for:", cardName);
    
    // Use Scryfall API for Magic images
    const query = cardName.replace(/[^\w\s]/g, ' ').trim();
    const response = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.image_uris?.large || data.image_uris?.normal || data.image_uris?.small;
      if (imageUrl) {
        console.log("Found MTG image from Scryfall");
        return imageUrl;
      }
      // Check card_faces for double-faced cards
      if (data.card_faces?.[0]?.image_uris?.large) {
        return data.card_faces[0].image_uris.large;
      }
    }
  } catch (e) {
    console.log("MTG image fallback failed:", e);
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

async function getLorcanaImageFallback(cardName: string): Promise<string | null> {
  try {
    console.log("Trying Lorcana image fallback for:", cardName);
    
    // Use Lorcast API for Lorcana images
    const query = cardName.replace(/[^\w\s]/g, ' ').trim();
    const response = await fetch(
      `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(query)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results?.[0]?.image_urls?.digital?.large) {
        console.log("Found Lorcana image from Lorcast");
        return data.results[0].image_urls.digital.large;
      }
    }
  } catch (e) {
    console.log("Lorcana image fallback failed:", e);
  }
  return null;
}

// ==================== JUSTTCG API ====================

// Helper to extract image URL from card or variants array
function extractImageUrl(card: any): string | null {
  // Priority 1: Direct image URL on card object
  const directUrl = card.image_url || card.image || card.imageUrl || card.high_res_url;
  if (directUrl) return directUrl;
  
  // Priority 2: Images object (large/small)
  if (card.images) {
    const imagesUrl = card.images.large || card.images.small || card.images.normal;
    if (imagesUrl) return imagesUrl;
  }
  
  // Priority 3: Check variants array for image URLs
  if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
    for (const variant of card.variants) {
      const variantUrl = variant.image_url || variant.image || variant.imageUrl || variant.high_res_url;
      if (variantUrl) return variantUrl;
    }
  }
  
  return null;
}

// Helper to filter variants for Near Mint condition and extract best price
function extractNearMintPrice(variants: any[], printing?: string | null): {
  low: number | null;
  market: number | null;
  high: number | null;
} {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return { low: null, market: null, high: null };
  }

  // Filter for Near Mint condition first
  let filteredVariants = variants.filter((v: any) => {
    const condition = (v.condition || v.variant_condition || '').toLowerCase();
    return condition.includes('near mint') || condition.includes('nm') || condition === 'mint';
  });

  // If no Near Mint variants found, use all variants
  if (filteredVariants.length === 0) {
    filteredVariants = variants;
  }

  // If printing specified (e.g., 'Normal', 'Holo', 'Foil'), try to match it
  if (printing) {
    const printingLower = printing.toLowerCase();
    const printingMatches = filteredVariants.filter((v: any) => {
      const variantPrinting = (v.printing || v.variant_printing || v.foil || '').toLowerCase();
      return variantPrinting.includes(printingLower) || 
             (printingLower === 'holo' && (variantPrinting.includes('holo') || variantPrinting.includes('foil'))) ||
             (printingLower === 'normal' && !variantPrinting.includes('holo') && !variantPrinting.includes('foil'));
    });
    if (printingMatches.length > 0) {
      filteredVariants = printingMatches;
    }
  }

  // Extract prices from filtered variants
  const prices = filteredVariants
    .map((v: any) => {
      const price = v.market_price ?? v.marketPrice ?? v.price ?? v.low_price ?? v.lowPrice;
      return typeof price === "number" ? price : parseFloat(price);
    })
    .filter((p: number) => !isNaN(p) && p > 0);

  if (prices.length === 0) {
    return { low: null, market: null, high: null };
  }

  return {
    low: Math.min(...prices),
    market: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
    high: Math.max(...prices),
  };
}

async function lookupJustTCG(
  game: GameType,
  cardName: string,
  cardNumber?: string | null,
  setName?: string | null
): Promise<{
  cards: CandidateCard[];
  bestMatch: CandidateCard | null;
}> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JUSTTCG_API_KEY not configured, skipping price lookup");
    return { cards: [], bestMatch: null };
  }

  // Map game types to JustTCG API slugs
  const gameSlugMap: Record<string, string> = {
    one_piece: "one-piece",      // One Piece keeps the dash
    pokemon: "pokemon",          // Standard
    dragonball: "dbs",           // Dragon Ball Super
    yugioh: "yugioh",            // Standard
    magic: "mtg",                // Magic uses 3-letter code
    lorcana: "lorcana",          // Standard
  };
  
  const gameSlug = game ? gameSlugMap[game] : null;
  
  // For non-game cards or unknown games, return early
  if (!gameSlug || game === "non_game") {
    console.log("Unsupported game for JustTCG or non-game card:", game);
    return { cards: [], bestMatch: null };
  }
  
  // Build search query - prioritize card number for accurate matching
  let searchQuery = cardName;
  
  // For One Piece, keep the dash in card numbers (e.g., OP01-001)
  if (game === "one_piece" && cardNumber) {
    searchQuery = cardNumber;
  } else if (game === "yugioh" && cardNumber) {
    // Yu-Gi-Oh uses set-number format (e.g., PHNI-EN001)
    searchQuery = cardNumber;
  } else {
    // Clean up the search query for other games
    searchQuery = cardName.replace(/[^\w\s\-]/g, ' ').trim();
  }
  
  // Build URL with query parameters
  let url = `https://api.justtcg.com/v1/cards?game=${gameSlug}&q=${encodeURIComponent(searchQuery)}&limit=15`;
  
  // Add set parameter if we have set name/number for more precise matching
  if (setName) {
    url += `&set=${encodeURIComponent(setName)}`;
  }

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
    // Detect printing type from card data (for variant filtering)
    const rarity = (card.rarity || '').toLowerCase();
    let printing: string | null = null;
    if (rarity.includes('holo') || rarity.includes('foil') || rarity.includes('secret')) {
      printing = 'holo';
    } else {
      printing = 'normal';
    }

    // Extract Near Mint prices using improved filtering
    const prices = card.variants && Array.isArray(card.variants) && card.variants.length > 0
      ? extractNearMintPrice(card.variants, printing)
      : { low: null, market: null, high: null };

    // Try to get price directly from card object if not in variants
    if (prices.market === null) {
      const directPrice = card.price ?? card.market_price ?? card.marketPrice;
      if (directPrice) {
        prices.market = typeof directPrice === "number" ? directPrice : parseFloat(directPrice);
        prices.market = Math.round(prices.market * 100) / 100;
      }
    }

    // Extract image URL - check card.image property specifically as per API docs
    const imageUrl = card.image || extractImageUrl(card);
    const cardNum = card.number || card.card_id || card.collector_number || card.cardNumber || null;

    return {
      cardName: card.name,
      set: card.set_name || card.set?.name || card.setName || null,
      number: cardNum,
      imageUrl,
      prices,
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

// Retry search by card number only if initial search found price but no image
async function retrySearchByCardNumber(
  game: GameType,
  cardNumber: string
): Promise<CandidateCard | null> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey || !cardNumber) return null;

  const gameSlugMap: Record<string, string> = {
    one_piece: "one-piece-card-game",
    pokemon: "pokemon",
    dragonball: "dragon-ball-super-fusion-world",
    yugioh: "yugioh",
    magic: "magic-the-gathering",
    lorcana: "lorcana",
  };
  
  const gameSlug = game ? gameSlugMap[game] : null;
  if (!gameSlug) return null;

  console.log("Retrying JustTCG search by card number:", cardNumber);

  const url = `https://api.justtcg.com/v1/cards?game=${gameSlug}&q=${encodeURIComponent(cardNumber)}&limit=5`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const rawCards = data.data || data || [];

    if (!Array.isArray(rawCards) || rawCards.length === 0) return null;

    // Find card with matching number that has an image
    for (const card of rawCards) {
      const cardNum = card.number || card.card_id || card.collector_number;
      const imageUrl = card.image_url || card.image || card.images?.large;
      
      if (cardNum?.toUpperCase() === cardNumber.toUpperCase() && imageUrl) {
        console.log("Found card with image on retry:", cardNum);
        return {
          cardName: card.name,
          set: card.set_name || card.set?.name || null,
          number: cardNum,
          imageUrl,
          prices: {
            low: null,
            market: card.price || card.market_price || null,
            high: null,
          },
        };
      }
    }
  } catch (e) {
    console.log("Retry search failed:", e);
  }

  return null;
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

    // Step 1: Try Ximilar API for card recognition first
    const ximilarResult = await recognizeCardWithXimilar(image_data);
    
    let ocrText = ximilarResult.ocrText || "";
    let parsedInfo: ParsedCardInfo;
    
    // Use Ximilar result if we got a confident match
    if (ximilarResult.cardName && ximilarResult.confidence > 0.5) {
      console.log("Using Ximilar recognition result:", ximilarResult);
      parsedInfo = {
        cardName: ximilarResult.cardName,
        cardNumber: null, // Ximilar may not provide card number
        game: ximilarResult.game,
        setName: ximilarResult.set,
      };
      
      // Still try to get OCR text for card number extraction if Ximilar didn't provide it
      if (!ocrText) {
        const visionResult = await extractTextWithGoogleVision(image_data);
        ocrText = visionResult.text || "";
        
        // Try to extract card number from OCR
        if (ocrText) {
          const ocrParsed = parseOcrText(ocrText);
          if (ocrParsed.cardNumber) {
            parsedInfo.cardNumber = ocrParsed.cardNumber;
          }
          // If Ximilar didn't detect the game, use OCR detection
          if (!parsedInfo.game && ocrParsed.game) {
            parsedInfo.game = ocrParsed.game;
          }
        }
      }
    } else {
      // Fallback: Use Google Vision OCR for text extraction
      console.log("Ximilar confidence too low or no result, using Google Vision OCR...");
      const ocrResult = await extractTextWithGoogleVision(image_data);
      ocrText = ocrResult.text || "";

      if (!ocrText || ocrText.trim().length < 3) {
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
          ocrText: ocrText,
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
      parsedInfo = parseOcrText(ocrText);
    }
    
    console.log("Parsed card info:", parsedInfo);

    // Handle non-game cards (sports, etc.)
    // IMPORTANT: For non-game cards, we return null imageUrl so the frontend uses the captured preview
    if (parsedInfo.game === "non_game") {
      const result: ScanResult = {
        game: "non_game",
        cardName: parsedInfo.cardName || "Non-TCG Card",
        set: null,
        number: parsedInfo.cardNumber,
        imageUrl: null, // Frontend will use captured preview image
        prices: { low: null, market: null, high: null },
        confidence: ximilarResult.confidence || 0.5,
        source: "live",
        error: "N/A - Non-TCG", // Clear message for non-game cards
        ocrText: ocrText,
      };

      return new Response(JSON.stringify(result), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remainingScans.toString(),
        },
      });
    }

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
        ocrText: ocrText,
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
    let { cards, bestMatch } = await lookupJustTCG(
      game,
      searchTerm,
      parsedInfo.cardNumber,
      parsedInfo.setName // Pass set name for more precise matching
    );

    // Step 5: If we have price but no image, retry by card number
    if (bestMatch && !bestMatch.imageUrl && parsedInfo.cardNumber) {
      console.log("Best match has price but no image, retrying by card number...");
      const retryResult = await retrySearchByCardNumber(game, parsedInfo.cardNumber);
      if (retryResult?.imageUrl) {
        bestMatch.imageUrl = retryResult.imageUrl;
      }
    }

    // Step 6: Apply game-specific image fallbacks
    let fallbackImageUrl: string | null = null;
    
    // Try fallbacks if no image from JustTCG
    if (!bestMatch?.imageUrl) {
      console.log("No image from JustTCG, trying game-specific fallback...");
      
      if (game === "one_piece" && parsedInfo.cardNumber) {
        fallbackImageUrl = await getOnePieceImageFallback(parsedInfo.cardNumber);
      } else if (game === "yugioh" && parsedInfo.cardName) {
        fallbackImageUrl = await getYuGiOhImageFallback(parsedInfo.cardName, parsedInfo.cardNumber);
      } else if (game === "magic" && parsedInfo.cardName) {
        fallbackImageUrl = await getMagicImageFallback(parsedInfo.cardName);
      } else if (game === "pokemon" && parsedInfo.cardName) {
        fallbackImageUrl = await getPokemonImageFallback(parsedInfo.cardName, parsedInfo.cardNumber || undefined);
      } else if (game === "dragonball" && parsedInfo.cardNumber) {
        fallbackImageUrl = await getDragonBallImageFallback(parsedInfo.cardNumber);
      } else if (game === "lorcana" && parsedInfo.cardName) {
        fallbackImageUrl = await getLorcanaImageFallback(parsedInfo.cardName);
      }
    }

    // Also apply fallbacks to candidates that are missing images
    if (cards.length > 0) {
      cards = await Promise.all(cards.map(async (card) => {
        if (!card.imageUrl && card.number) {
          let imgUrl: string | null = null;
          if (game === "one_piece") {
            imgUrl = await getOnePieceImageFallback(card.number);
          } else if (game === "yugioh") {
            imgUrl = await getYuGiOhImageFallback(card.cardName, card.number);
          } else if (game === "magic") {
            imgUrl = await getMagicImageFallback(card.cardName);
          } else if (game === "pokemon") {
            imgUrl = await getPokemonImageFallback(card.cardName, card.number);
          } else if (game === "dragonball") {
            imgUrl = await getDragonBallImageFallback(card.number);
          } else if (game === "lorcana") {
            imgUrl = await getLorcanaImageFallback(card.cardName);
          }
          if (imgUrl) {
            return { ...card, imageUrl: imgUrl };
          }
        }
        return card;
      }));
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
      ocrText: ocrText,
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
