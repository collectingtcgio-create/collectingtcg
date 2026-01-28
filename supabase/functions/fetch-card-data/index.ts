import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type TcgGame = 'pokemon' | 'magic' | 'yugioh' | 'onepiece' | 'dragonball' | 'lorcana' | 'unionarena';

interface CardSearchRequest {
  query: string;
  tcg_game?: TcgGame;
  set_code?: string;
  limit?: number;
}

interface CardResult {
  id: string;
  external_id: string;
  tcg_game: TcgGame;
  card_name: string;
  set_name?: string;
  set_code?: string;
  card_number?: string;
  rarity?: string;
  image_url?: string;
  image_url_small?: string;
  price_low?: number;
  price_mid?: number;
  price_high?: number;
  price_market?: number;
  price_currency?: string;
  price_source?: string;
}

// One Piece TCG Sets for manual search
const ONE_PIECE_SETS = [
  { code: 'OP01', name: 'Romance Dawn' },
  { code: 'OP02', name: 'Paramount War' },
  { code: 'OP03', name: 'Pillars of Strength' },
  { code: 'OP04', name: 'Kingdoms of Intrigue' },
  { code: 'OP05', name: 'Awakening of the New Era' },
  { code: 'OP06', name: 'Wings of the Captain' },
  { code: 'OP07', name: '500 Years in the Future' },
  { code: 'OP08', name: 'Two Legends' },
  { code: 'OP09', name: 'The Four Emperors' },
  { code: 'ST01', name: 'Straw Hat Crew' },
  { code: 'ST02', name: 'Worst Generation' },
  { code: 'ST03', name: 'The Seven Warlords of the Sea' },
  { code: 'ST04', name: 'Animal Kingdom Pirates' },
  { code: 'ST05', name: 'One Piece Film Edition' },
  { code: 'ST06', name: 'Absolute Justice' },
  { code: 'ST07', name: 'Big Mom Pirates' },
  { code: 'ST08', name: 'Monkey.D.Luffy' },
  { code: 'ST09', name: 'Yamato' },
  { code: 'ST10', name: 'The Three Captains' },
];

// TCGdex API for Pokémon cards
async function searchPokemonCards(query: string, limit: number = 10): Promise<CardResult[]> {
  try {
    const response = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      console.error("TCGdex API error:", response.status);
      return [];
    }

    const cards = await response.json();
    
    if (!Array.isArray(cards)) return [];

    const results: CardResult[] = [];
    for (const card of cards.slice(0, limit)) {
      try {
        const detailResponse = await fetch(`https://api.tcgdex.net/v2/en/cards/${card.id}`);
        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          results.push({
            id: crypto.randomUUID(),
            external_id: detail.id || card.id,
            tcg_game: 'pokemon',
            card_name: detail.name || card.name,
            set_name: detail.set?.name,
            set_code: detail.set?.id,
            card_number: detail.localId,
            rarity: detail.rarity,
            image_url: detail.image ? `${detail.image}/high.webp` : undefined,
            image_url_small: detail.image ? `${detail.image}/low.webp` : undefined,
            price_currency: 'USD',
          });
        }
      } catch (e) {
        console.error("Error fetching Pokemon card detail:", e);
      }
    }

    return results;
  } catch (error) {
    console.error("Pokemon search error:", error);
    return [];
  }
}

// JustTCG API for One Piece cards with images and pricing
async function searchOnePieceCardsJustTCG(query: string, setCode?: string, limit: number = 10): Promise<CardResult[]> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JustTCG API key not configured");
    return [];
  }

  try {
    // Build query params
    let url = `https://api.justtcg.com/v1/cards?game=one-piece&q=${encodeURIComponent(query)}`;
    if (setCode) {
      url += `&set=${encodeURIComponent(setCode)}`;
    }
    url += `&limit=${limit}`;

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
      if (response.status === 429) {
        console.warn("JustTCG rate limit reached");
      }
      return [];
    }

    const data = await response.json();
    const cards = data.data || data || [];

    console.log(`JustTCG returned ${cards.length} One Piece cards`);

    if (!Array.isArray(cards)) return [];

    return cards.slice(0, limit).map((card: any) => {
      // Extract market price from variants
      let marketPrice = null;
      if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
        const highestPriceVariant = card.variants.reduce((max: any, v: any) => 
          (v.price || 0) > (max.price || 0) ? v : max, card.variants[0]);
        marketPrice = highestPriceVariant?.price || null;
      }

      return {
        id: crypto.randomUUID(),
        external_id: card.id || card.card_id || `op-${card.name}`,
        tcg_game: 'onepiece' as TcgGame,
        card_name: card.name,
        set_name: card.set?.name || card.setName,
        set_code: card.set?.id || card.setCode,
        card_number: card.card_id || card.number || card.collector_number,
        rarity: card.rarity,
        image_url: card.image_url || card.image || card.images?.large || card.images?.small,
        image_url_small: card.images?.small || card.image_url || card.image,
        price_market: marketPrice,
        price_currency: 'USD',
        price_source: 'justtcg',
      };
    });
  } catch (error) {
    console.error("JustTCG One Piece search error:", error);
    return [];
  }
}

// Fallback: TCG Codex API for One Piece cards
async function searchOnePieceCardsTCGCodex(query: string, limit: number = 10): Promise<CardResult[]> {
  try {
    const response = await fetch(
      `https://api.tcgcodex.com/api/cards?name=${encodeURIComponent(query)}&game=onepiece`
    );
    
    if (!response.ok) {
      console.error("TCG Codex API error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards = data.data || data.results || data || [];
    
    if (!Array.isArray(cards)) return [];

    return cards.slice(0, limit).map((card: any) => ({
      id: crypto.randomUUID(),
      external_id: card.id || card.code || `op-${card.name}`,
      tcg_game: 'onepiece' as TcgGame,
      card_name: card.name,
      set_name: card.set?.name || card.setName,
      set_code: card.set?.code || card.setCode,
      card_number: card.number || card.code,
      rarity: card.rarity,
      image_url: card.imageUrl || card.image,
      image_url_small: card.thumbnailUrl || card.image,
      price_currency: 'USD',
    }));
  } catch (error) {
    console.error("TCG Codex One Piece search error:", error);
    return [];
  }
}

// Combined One Piece search: JustTCG primary, TCG Codex fallback
async function searchOnePieceCards(query: string, setCode?: string, limit: number = 10): Promise<CardResult[]> {
  // Try JustTCG first (has images AND pricing)
  let results = await searchOnePieceCardsJustTCG(query, setCode, limit);
  
  if (results.length === 0) {
    console.log("JustTCG returned no results, trying TCG Codex...");
    // Fallback to TCG Codex for images
    results = await searchOnePieceCardsTCGCodex(query, limit);
    
    // If TCG Codex found cards, try to get pricing from JustTCG
    for (const card of results) {
      if (!card.price_market) {
        const priceResults = await searchOnePieceCardsJustTCG(card.card_name, undefined, 1);
        if (priceResults.length > 0 && priceResults[0].price_market) {
          card.price_market = priceResults[0].price_market;
          card.price_source = 'justtcg';
        }
      }
    }
  }

  return results;
}

// JustTCG API for multi-game pricing
async function fetchJustTCGPrices(cardName: string, tcgGame: TcgGame): Promise<{
  price_low?: number;
  price_mid?: number;
  price_high?: number;
  price_market?: number;
  image_url?: string;
}> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JustTCG API key not configured, skipping price lookup");
    return {};
  }

  try {
    const gameMap: Record<TcgGame, string> = {
      pokemon: 'pokemon',
      magic: 'mtg',
      yugioh: 'yugioh',
      onepiece: 'one-piece',
      dragonball: 'dbs',
      lorcana: 'lorcana',
      unionarena: 'unionarena',
    };

    const response = await fetch(
      `https://api.justtcg.com/v1/cards?game=${gameMap[tcgGame]}&q=${encodeURIComponent(cardName)}`,
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("JustTCG rate limit reached");
      }
      return {};
    }

    const data = await response.json();
    const card = data.data?.[0] || data[0];

    if (!card) return {};

    // Extract market price from variants
    let marketPrice = null;
    if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
      const highestPriceVariant = card.variants.reduce((max: any, v: any) => 
        (v.price || 0) > (max.price || 0) ? v : max, card.variants[0]);
      marketPrice = highestPriceVariant?.price || null;
    }

    return {
      price_low: card.prices?.low || card.priceLow,
      price_mid: card.prices?.mid || card.priceMid,
      price_high: card.prices?.high || card.priceHigh,
      price_market: marketPrice || card.prices?.market || card.priceMarket,
      image_url: card.image_url || card.image || card.images?.large,
    };
  } catch (error) {
    console.error("JustTCG price fetch error:", error);
    return {};
  }
}

// Generic search for other TCGs
async function searchGenericCards(query: string, tcgGame: TcgGame, limit: number = 10): Promise<CardResult[]> {
  const pricesAndImage = await fetchJustTCGPrices(query, tcgGame);
  
  return [{
    id: crypto.randomUUID(),
    external_id: `${tcgGame}-${query.toLowerCase().replace(/\s+/g, '-')}`,
    tcg_game: tcgGame,
    card_name: query,
    image_url: pricesAndImage.image_url,
    ...pricesAndImage,
    price_currency: 'USD',
    price_source: 'justtcg',
  }];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CardSearchRequest = await req.json();
    const { query, tcg_game, set_code, limit = 10 } = body;

    // Handle special request for One Piece sets list
    if (query === "__GET_ONEPIECE_SETS__") {
      return new Response(
        JSON.stringify({ success: true, sets: ONE_PIECE_SETS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQuery = query.trim();
    
    // First, check cache
    let cacheQuery = supabase
      .from("card_cache")
      .select("*")
      .ilike("card_name", `%${searchQuery}%`)
      .limit(limit);

    if (tcg_game) {
      cacheQuery = cacheQuery.eq("tcg_game", tcg_game);
    }

    const { data: cachedCards } = await cacheQuery;

    if (cachedCards && cachedCards.length > 0) {
      const freshCards = cachedCards.filter(card => {
        if (!card.price_updated_at) return false;
        const priceAge = Date.now() - new Date(card.price_updated_at).getTime();
        return priceAge < 24 * 60 * 60 * 1000;
      });

      if (freshCards.length > 0) {
        console.log(`Returning ${freshCards.length} cached cards for "${searchQuery}"`);
        return new Response(
          JSON.stringify({ success: true, cards: freshCards, source: "cache" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from external APIs
    let results: CardResult[] = [];
    const gamesToSearch: TcgGame[] = tcg_game 
      ? [tcg_game] 
      : ['pokemon', 'onepiece', 'magic', 'yugioh', 'dragonball', 'lorcana'];

    for (const game of gamesToSearch) {
      let gameResults: CardResult[] = [];

      switch (game) {
        case 'pokemon':
          gameResults = await searchPokemonCards(searchQuery, limit);
          break;
        case 'onepiece':
          gameResults = await searchOnePieceCards(searchQuery, set_code, limit);
          break;
        default:
          gameResults = await searchGenericCards(searchQuery, game, limit);
          break;
      }

      // Fetch prices from JustTCG if not already present
      for (const card of gameResults) {
        if (!card.price_market && !card.price_mid) {
          const pricesAndImage = await fetchJustTCGPrices(card.card_name, game);
          Object.assign(card, pricesAndImage, { price_source: 'justtcg' });
          // Also update image if missing
          if (!card.image_url && pricesAndImage.image_url) {
            card.image_url = pricesAndImage.image_url;
          }
        }
      }

      results = results.concat(gameResults);

      if (results.length >= limit) {
        results = results.slice(0, limit);
        break;
      }
    }

    // Cache the results
    for (const card of results) {
      const { id, ...cardData } = card;
      try {
        await supabase
          .from("card_cache")
          .upsert({
            ...cardData,
            price_updated_at: new Date().toISOString(),
          }, {
            onConflict: 'external_id,tcg_game',
          });
      } catch (e) {
        console.error("Error caching card:", e);
      }
    }

    console.log(`Fetched ${results.length} cards for "${searchQuery}" from APIs`);

    return new Response(
      JSON.stringify({ success: true, cards: results, source: "api" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-card-data:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
