import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type TcgGame = 'pokemon' | 'magic' | 'yugioh' | 'onepiece' | 'dragonball' | 'lorcana' | 'unionarena' | 'marvel';

export interface CardResult {
  id?: string;
  card_name: string;
  tcg_game: TcgGame;
  set_name?: string;
  set_code?: string;
  rarity?: string;
  card_number?: string;
  image_url: string | null;
  price_estimate: number | null;
  price_market?: number | null;
  price_foil?: number | null;
  confidence?: number;
  variant?: string; // foil, non-foil, alt-art, etc.
}

interface ApiResponse {
  success: boolean;
  cards?: CardResult[];
  error?: string;
  processing_time_ms?: number;
}

// Enhanced prompt with game hint support
function getTCGDetectionPrompt(gameHint?: TcgGame): string {
  const basePrompt = `You are an expert trading card game identifier. Analyze this image and identify the trading card(s) shown.

Supported TCGs:
- pokemon (Pokémon TCG)
- magic (Magic: The Gathering)
- yugioh (Yu-Gi-Oh!)
- onepiece (One Piece Card Game)
- dragonball (Dragon Ball Super Card Game)
- lorcana (Disney Lorcana)
- unionarena (Union Arena)
- marvel (Marvel Non-Sport cards like Skybox, Fleer Ultra, etc.)

${gameHint ? `HINT: The user expects this to be a ${gameHint} card. Prioritize this game type in your identification.` : ''}

For each card visible in the image, provide:
1. card_name: The exact card name as printed
2. tcg_game: One of the supported game identifiers above
3. set_name: The set/expansion name if visible (e.g., "1992 Skybox Marvel Masterpieces" for Marvel)
4. card_number: The card number/code if visible
5. rarity: The rarity (common, uncommon, rare, ultra rare, secret rare, etc.)
6. variant: If applicable (foil, non-foil, holo, reverse holo, alt-art, enchanted, etc.)

For Marvel Non-Sport cards, look for:
- Year and manufacturer (e.g., "1992 Skybox", "1994 Fleer Ultra")
- Character names
- Set names (Marvel Masterpieces, X-Men, Spider-Man, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "cards": [
    {
      "card_name": "Card Name Here",
      "tcg_game": "pokemon",
      "set_name": "Set Name",
      "card_number": "123/456",
      "rarity": "Rare",
      "variant": "holo"
    }
  ]
}

If no trading card is detected, respond with:
{"cards": [], "error": "No trading card detected in image"}`;

  return basePrompt;
}

async function identifyWithAI(imageData: string, gameHint?: TcgGame): Promise<{ cards: any[]; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

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
            { type: "text", text: getTCGDetectionPrompt(gameHint) },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Content}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
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

  try {
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

// ==================== API ROUTERS ====================

// Scryfall API for Magic: The Gathering
async function fetchMagicCard(cardName: string): Promise<CardResult[]> {
  try {
    // Try exact name first
    let response = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`
    );

    if (!response.ok) {
      // Try search instead
      response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&order=released`
      );
    }

    if (!response.ok) {
      console.error("Scryfall API error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards = data.data || [data];

    return cards.slice(0, 15).map((card: any) => ({
      id: crypto.randomUUID(),
      card_name: card.name,
      tcg_game: 'magic' as TcgGame,
      set_name: card.set_name,
      set_code: card.set?.toUpperCase(),
      card_number: card.collector_number,
      rarity: card.rarity,
      image_url: card.image_uris?.large || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.large,
      price_estimate: card.prices?.usd ? parseFloat(card.prices.usd) : null,
      price_market: card.prices?.usd ? parseFloat(card.prices.usd) : null,
      price_foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null,
      variant: card.foil ? 'foil' : 'non-foil',
      confidence: 0.95,
    }));
  } catch (error) {
    console.error("Scryfall error:", error);
    return [];
  }
}

// Lorcast API for Disney Lorcana
async function fetchLorcanaCard(cardName: string): Promise<CardResult[]> {
  try {
    const response = await fetch(
      `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(cardName)}`
    );

    if (!response.ok) {
      console.error("Lorcast API error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards = data.results || data.data || [];

    return cards.slice(0, 15).map((card: any) => ({
      id: crypto.randomUUID(),
      card_name: card.name || card.full_name,
      tcg_game: 'lorcana' as TcgGame,
      set_name: card.set?.name || card.set_name,
      set_code: card.set?.code,
      card_number: card.collector_number || card.number,
      rarity: card.rarity,
      image_url: card.image_uris?.digital?.large || card.image_url || card.image,
      price_estimate: card.prices?.usd ? parseFloat(card.prices.usd) : null,
      price_market: card.prices?.usd ? parseFloat(card.prices.usd) : null,
      price_foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null,
      variant: card.foil ? 'enchanted' : 'standard',
      confidence: 0.9,
    }));
  } catch (error) {
    console.error("Lorcast error:", error);
    return [];
  }
}

// TCGdex for Pokémon cards
async function fetchPokemonCard(cardName: string): Promise<CardResult[]> {
  try {
    const response = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(cardName)}`
    );

    if (!response.ok) {
      console.error("TCGdex API error:", response.status);
      return [];
    }

    const cards = await response.json();
    if (!Array.isArray(cards)) return [];

    const results: CardResult[] = [];
    
    for (const card of cards.slice(0, 15)) {
      try {
        const detailResponse = await fetch(`https://api.tcgdex.net/v2/en/cards/${card.id}`);
        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          results.push({
            id: crypto.randomUUID(),
            card_name: detail.name || card.name,
            tcg_game: 'pokemon' as TcgGame,
            set_name: detail.set?.name,
            set_code: detail.set?.id,
            card_number: detail.localId,
            rarity: detail.rarity,
            image_url: detail.image ? `${detail.image}/high.webp` : null,
            price_estimate: null, // Will be enriched by JustTCG
            confidence: 0.9,
          });
        }
      } catch (e) {
        console.error("Error fetching Pokemon detail:", e);
      }
    }

    return results;
  } catch (error) {
    console.error("TCGdex error:", error);
    return [];
  }
}

// YGOProDeck API for Yu-Gi-Oh! cards
async function fetchYugiohCard(cardName: string): Promise<CardResult[]> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cardName)}`
    );

    if (!response.ok) {
      console.error("YGOProDeck API error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards = data.data || [];

    return cards.slice(0, 15).map((card: any) => {
      // Get card prices from TCGPlayer data
      const prices = card.card_prices?.[0] || {};
      const tcgPrice = prices.tcgplayer_price ? parseFloat(prices.tcgplayer_price) : null;
      
      // Get best image (prefer cropped art for display)
      const images = card.card_images?.[0] || {};
      const imageUrl = images.image_url || images.image_url_cropped;

      return {
        id: crypto.randomUUID(),
        card_name: card.name,
        tcg_game: 'yugioh' as TcgGame,
        set_name: card.card_sets?.[0]?.set_name || null,
        set_code: card.card_sets?.[0]?.set_code || null,
        card_number: card.card_sets?.[0]?.set_code || card.id?.toString(),
        rarity: card.card_sets?.[0]?.set_rarity || null,
        image_url: imageUrl,
        price_estimate: tcgPrice,
        price_market: tcgPrice,
        variant: 'standard',
        confidence: 0.95,
      };
    });
  } catch (error) {
    console.error("YGOProDeck error:", error);
    return [];
  }
}

// DBS Cards API / JustTCG for Dragon Ball Super cards
async function fetchDragonBallCard(cardName: string): Promise<CardResult[]> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JustTCG API key not configured for Dragon Ball");
    return [];
  }

  try {
    // JustTCG uses "dragon-ball-super-fusion-world" for Dragon Ball
    const url = `https://api.justtcg.com/v1/cards?game=dragon-ball-super-fusion-world&q=${encodeURIComponent(cardName)}&limit=15`;
    
    console.log("Fetching Dragon Ball cards from JustTCG:", url);

    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("JustTCG Dragon Ball API error:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    const cards = data.data || data || [];

    if (!Array.isArray(cards)) return [];

    return cards.map((card: any) => {
      let marketPrice = null;
      if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
        const highestPriceVariant = card.variants.reduce((max: any, v: any) => 
          (v.price || 0) > (max.price || 0) ? v : max, card.variants[0]);
        marketPrice = highestPriceVariant?.price || null;
      }

      return {
        id: crypto.randomUUID(),
        card_name: card.name,
        tcg_game: 'dragonball' as TcgGame,
        set_name: card.set?.name || card.setName,
        set_code: card.set?.id || card.setCode,
        card_number: card.card_id || card.number || card.collector_number,
        rarity: card.rarity,
        image_url: card.image_url || card.image || card.images?.large || card.images?.small,
        price_estimate: marketPrice,
        price_market: marketPrice,
        variant: 'standard',
        confidence: 0.95,
      };
    });
  } catch (error) {
    console.error("JustTCG Dragon Ball error:", error);
    return [];
  }
}

// JustTCG for One Piece cards
async function fetchOnePieceCard(cardName: string, setCode?: string): Promise<CardResult[]> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JustTCG API key not configured");
    return [];
  }

  try {
    let url = `https://api.justtcg.com/v1/cards?game=one-piece-card-game&q=${encodeURIComponent(cardName)}&limit=15`;
    if (setCode) {
      url += `&set=${encodeURIComponent(setCode)}`;
    }

    console.log("Fetching One Piece cards from JustTCG:", url);

    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("JustTCG API error:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    const cards = data.data || data || [];

    if (!Array.isArray(cards)) return [];

    return cards.map((card: any) => {
      let marketPrice = null;
      if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
        const highestPriceVariant = card.variants.reduce((max: any, v: any) => 
          (v.price || 0) > (max.price || 0) ? v : max, card.variants[0]);
        marketPrice = highestPriceVariant?.price || null;
      }

      return {
        id: crypto.randomUUID(),
        card_name: card.name,
        tcg_game: 'onepiece' as TcgGame,
        set_name: card.set?.name || card.setName,
        set_code: card.set?.id || card.setCode,
        card_number: card.card_id || card.number || card.collector_number,
        rarity: card.rarity,
        image_url: card.image_url || card.image || card.images?.large || card.images?.small,
        price_estimate: marketPrice,
        price_market: marketPrice,
        variant: 'standard',
        confidence: 0.95,
      };
    });
  } catch (error) {
    console.error("JustTCG One Piece error:", error);
    return [];
  }
}

// Google Vision + PriceCharting for Marvel Non-Sport cards
async function fetchMarvelCard(cardName: string, setName?: string): Promise<CardResult[]> {
  // For Marvel non-sport cards, we try to search PriceCharting
  // First, let's construct a search query
  const searchQuery = setName ? `${setName} ${cardName}` : cardName;
  
  try {
    // Note: PriceCharting doesn't have a public API, so we'll return a structured result
    // that the user can manually price, or use Google Vision for text extraction
    
    // Try to parse out year and manufacturer from the set name
    const yearMatch = setName?.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : null;
    
    return [{
      id: crypto.randomUUID(),
      card_name: cardName,
      tcg_game: 'marvel' as TcgGame,
      set_name: setName || 'Marvel Non-Sport',
      set_code: year || undefined,
      rarity: 'base',
      image_url: null,
      price_estimate: null,
      variant: 'standard',
      confidence: 0.7,
    }];
  } catch (error) {
    console.error("Marvel card fetch error:", error);
    return [];
  }
}

// Generic card fetch for other TCGs via JustTCG
async function fetchGenericCard(cardName: string, tcgGame: TcgGame): Promise<CardResult[]> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    return [{
      id: crypto.randomUUID(),
      card_name: cardName,
      tcg_game: tcgGame,
      image_url: null,
      price_estimate: null,
      confidence: 0.6,
    }];
  }

  try {
    const gameMap: Record<TcgGame, string> = {
      pokemon: 'pokemon',
      magic: 'magic-the-gathering',
      yugioh: 'yugioh',
      onepiece: 'one-piece-card-game',
      dragonball: 'dragon-ball-super-fusion-world',
      lorcana: 'disney-lorcana',
      unionarena: 'union-arena',
      marvel: 'marvel',
    };

    const response = await fetch(
      `https://api.justtcg.com/v1/cards?game=${gameMap[tcgGame]}&q=${encodeURIComponent(cardName)}&limit=15`,
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error("JustTCG generic error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards = data.data || data || [];

    return cards.map((card: any) => {
      let marketPrice = null;
      if (card.variants && Array.isArray(card.variants)) {
        const variant = card.variants[0];
        marketPrice = variant?.price || null;
      }

      return {
        id: crypto.randomUUID(),
        card_name: card.name,
        tcg_game: tcgGame,
        set_name: card.set?.name || card.setName,
        set_code: card.set?.id || card.setCode,
        card_number: card.collector_number || card.number,
        rarity: card.rarity,
        image_url: card.image_url || card.image || card.images?.large,
        price_estimate: marketPrice,
        price_market: marketPrice,
        confidence: 0.85,
      };
    });
  } catch (error) {
    console.error("JustTCG generic fetch error:", error);
    return [];
  }
}

// Main API router - routes to correct API based on game type
async function enrichCardData(cards: any[]): Promise<CardResult[]> {
  const enrichedCards: CardResult[] = [];

  for (const card of cards) {
    let results: CardResult[] = [];

    switch (card.tcg_game) {
      case 'magic':
        results = await fetchMagicCard(card.card_name);
        break;
      case 'lorcana':
        results = await fetchLorcanaCard(card.card_name);
        break;
      case 'pokemon':
        results = await fetchPokemonCard(card.card_name);
        // Enrich with JustTCG pricing
        for (const result of results) {
          if (!result.price_market) {
            const priceResults = await fetchGenericCard(result.card_name, 'pokemon');
            if (priceResults.length > 0 && priceResults[0].price_market) {
              result.price_market = priceResults[0].price_market;
              result.price_estimate = priceResults[0].price_market;
            }
          }
        }
        break;
      case 'onepiece':
        results = await fetchOnePieceCard(card.card_name);
        break;
      case 'yugioh':
        results = await fetchYugiohCard(card.card_name);
        break;
      case 'dragonball':
        results = await fetchDragonBallCard(card.card_name);
        break;
      case 'marvel':
        results = await fetchMarvelCard(card.card_name, card.set_name);
        break;
      default:
        results = await fetchGenericCard(card.card_name, card.tcg_game);
        break;
    }

    if (results.length > 0) {
      // Add all variants/versions to the result
      enrichedCards.push(...results.map(r => ({
        ...r,
        set_name: r.set_name || card.set_name,
        rarity: r.rarity || card.rarity,
        variant: r.variant || card.variant,
      })));
    } else {
      // Fallback to AI-detected data
      enrichedCards.push({
        id: crypto.randomUUID(),
        card_name: card.card_name,
        tcg_game: card.tcg_game,
        set_name: card.set_name,
        rarity: card.rarity,
        card_number: card.card_number,
        image_url: null,
        price_estimate: null,
        variant: card.variant,
        confidence: 0.5,
      });
    }
  }

  return enrichedCards;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { image_data, game_hint, search_query } = body;

    // Text-based search mode
    if (search_query && typeof search_query === 'string') {
      console.log(`Starting text search for: "${search_query}" with game hint: ${game_hint || 'auto'}...`);
      
      let searchResults: CardResult[] = [];
      const gameToSearch = game_hint as TcgGame | undefined;
      
      if (!gameToSearch || gameToSearch === 'auto' as any) {
        // Search across all TCGs in parallel
        const [pokemon, magic, yugioh, onepiece, lorcana, dragonball] = await Promise.all([
          fetchPokemonCard(search_query),
          fetchMagicCard(search_query),
          fetchYugiohCard(search_query),
          fetchOnePieceCard(search_query),
          fetchLorcanaCard(search_query),
          fetchDragonBallCard(search_query),
        ]);
        
        searchResults = [...pokemon, ...magic, ...yugioh, ...onepiece, ...lorcana, ...dragonball];
      } else {
        // Search specific TCG
        switch (gameToSearch) {
          case 'pokemon':
            searchResults = await fetchPokemonCard(search_query);
            break;
          case 'magic':
            searchResults = await fetchMagicCard(search_query);
            break;
          case 'yugioh':
            searchResults = await fetchYugiohCard(search_query);
            break;
          case 'onepiece':
            searchResults = await fetchOnePieceCard(search_query);
            break;
          case 'lorcana':
            searchResults = await fetchLorcanaCard(search_query);
            break;
          case 'dragonball':
            searchResults = await fetchDragonBallCard(search_query);
            break;
          default:
            searchResults = await fetchGenericCard(search_query, gameToSearch);
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`Text search found ${searchResults.length} cards in ${processingTime}ms`);

      return new Response(
        JSON.stringify({
          success: searchResults.length > 0,
          cards: searchResults.slice(0, 25), // Limit to 25 results
          processing_time_ms: processingTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Image-based scan mode
    if (!image_data) {
      return new Response(
        JSON.stringify({ success: false, error: "No image data or search query provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!image_data.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image format. Expected base64 data URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting AI card identification with game hint: ${game_hint || 'none'}...`);
    const aiResult = await identifyWithAI(image_data, game_hint);

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

    console.log(`AI identified ${aiResult.cards.length} cards, enriching with APIs...`);
    const enrichedCards = await enrichCardData(aiResult.cards);

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
    console.error("Error in identify-card-v3 function:", error);
    
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
