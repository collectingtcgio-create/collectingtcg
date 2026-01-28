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

// TCGdex API for Pokémon cards
async function searchPokemonCards(query: string, limit: number = 10): Promise<CardResult[]> {
  try {
    // Search by name
    const response = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      console.error("TCGdex API error:", response.status);
      return [];
    }

    const cards = await response.json();
    
    if (!Array.isArray(cards)) return [];

    // Get detailed info for each card (limited)
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

// OPTCG API for One Piece cards
async function searchOnePieceCards(query: string, limit: number = 10): Promise<CardResult[]> {
  try {
    const response = await fetch(
      `https://api.tcgcodex.com/api/cards?name=${encodeURIComponent(query)}&game=onepiece`
    );
    
    if (!response.ok) {
      console.error("OPTCG API error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards = data.data || data || [];
    
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
    console.error("One Piece search error:", error);
    return [];
  }
}

// JustTCG API for multi-game pricing
async function fetchJustTCGPrices(cardName: string, tcgGame: TcgGame): Promise<{
  price_low?: number;
  price_mid?: number;
  price_high?: number;
  price_market?: number;
}> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JustTCG API key not configured, skipping price lookup");
    return {};
  }

  try {
    // Map our game types to JustTCG's format
    const gameMap: Record<TcgGame, string> = {
      pokemon: 'pokemon',
      magic: 'mtg',
      yugioh: 'yugioh',
      onepiece: 'onepiece',
      dragonball: 'dbs',
      lorcana: 'lorcana',
      unionarena: 'unionarena',
    };

    const response = await fetch(
      `https://api.justtcg.com/v1/cards/search?q=${encodeURIComponent(cardName)}&game=${gameMap[tcgGame]}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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

    return {
      price_low: card.prices?.low || card.priceLow,
      price_mid: card.prices?.mid || card.priceMid,
      price_high: card.prices?.high || card.priceHigh,
      price_market: card.prices?.market || card.priceMarket,
    };
  } catch (error) {
    console.error("JustTCG price fetch error:", error);
    return {};
  }
}

// Generic search for other TCGs (uses AI identification + JustTCG)
async function searchGenericCards(query: string, tcgGame: TcgGame, limit: number = 10): Promise<CardResult[]> {
  // For games without dedicated free APIs, we create a basic result
  // and try to get pricing from JustTCG
  const prices = await fetchJustTCGPrices(query, tcgGame);
  
  return [{
    id: crypto.randomUUID(),
    external_id: `${tcgGame}-${query.toLowerCase().replace(/\s+/g, '-')}`,
    tcg_game: tcgGame,
    card_name: query,
    ...prices,
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
    const { query, tcg_game, limit = 10 } = body;

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
      // Check if prices are stale (older than 24 hours)
      const freshCards = cachedCards.filter(card => {
        if (!card.price_updated_at) return false;
        const priceAge = Date.now() - new Date(card.price_updated_at).getTime();
        return priceAge < 24 * 60 * 60 * 1000; // 24 hours
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
          gameResults = await searchOnePieceCards(searchQuery, limit);
          break;
        default:
          // For other TCGs, use generic search with JustTCG pricing
          gameResults = await searchGenericCards(searchQuery, game, limit);
          break;
      }

      // Fetch prices from JustTCG if not already present
      for (const card of gameResults) {
        if (!card.price_market && !card.price_mid) {
          const prices = await fetchJustTCGPrices(card.card_name, game);
          Object.assign(card, prices, { price_source: 'justtcg' });
        }
      }

      results = results.concat(gameResults);

      // Limit total results
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
