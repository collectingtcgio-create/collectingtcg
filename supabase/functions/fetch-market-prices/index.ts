const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PriceResult {
  id: string;
  name: string;
  price: number | null;
  priceChange?: number;
  image_url?: string | null;
}

// Holy Grail items to fetch prices for
const GRAIL_ITEMS = [
  // Magic - Scryfall
  { id: "black-lotus", game: "magic", query: "Black Lotus", set: "lea" },
  { id: "mox-sapphire", game: "magic", query: "Mox Sapphire", set: "leb" },
  { id: "ancestral-recall", game: "magic", query: "Ancestral Recall", set: "lea" },
  
  // Yu-Gi-Oh - YGOProDeck
  { id: "blue-eyes-lob", game: "yugioh", query: "Blue-Eyes White Dragon" },
  { id: "dark-magician-lob", game: "yugioh", query: "Dark Magician" },
  
  // One Piece - JustTCG
  { id: "luffy-op01-alt", game: "onepiece", query: "Monkey D. Luffy" },
  { id: "shanks-op01", game: "onepiece", query: "Shanks" },
  { id: "nami-op01", game: "onepiece", query: "Nami" },
  
  // Pokemon - TCGdex (no prices, but we'll try)
  { id: "psa10-charizard-1st", game: "pokemon", query: "Charizard" },
  { id: "pikachu-illustrator", game: "pokemon", query: "Pikachu" },
];

// Fetch Magic prices from Scryfall (free API)
async function fetchScryfallPrice(cardName: string, setCode?: string): Promise<{ price: number | null; image_url: string | null }> {
  try {
    let url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
    if (setCode) {
      url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&set=${setCode}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Scryfall error:", response.status);
      return { price: null, image_url: null };
    }
    
    const data = await response.json();
    const price = data.prices?.usd ? parseFloat(data.prices.usd) : null;
    const image_url = data.image_uris?.large || data.card_faces?.[0]?.image_uris?.large;
    
    return { price, image_url };
  } catch (error) {
    console.error("Scryfall fetch error:", error);
    return { price: null, image_url: null };
  }
}

// Fetch Yu-Gi-Oh prices from YGOProDeck (free API)
async function fetchYGOPrice(cardName: string): Promise<{ price: number | null; image_url: string | null }> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`
    );
    
    if (!response.ok) {
      console.error("YGOProDeck error:", response.status);
      return { price: null, image_url: null };
    }
    
    const data = await response.json();
    const card = data.data?.[0];
    if (!card) return { price: null, image_url: null };
    
    const prices = card.card_prices?.[0];
    const price = prices?.tcgplayer_price ? parseFloat(prices.tcgplayer_price) : null;
    const image_url = card.card_images?.[0]?.image_url;
    
    return { price, image_url };
  } catch (error) {
    console.error("YGOProDeck fetch error:", error);
    return { price: null, image_url: null };
  }
}

// Fetch One Piece prices from JustTCG
async function fetchJustTCGPrice(cardName: string): Promise<{ price: number | null; image_url: string | null }> {
  const apiKey = Deno.env.get("JUSTTCG_API_KEY");
  if (!apiKey) {
    console.log("JustTCG API key not configured");
    return { price: null, image_url: null };
  }
  
  try {
    const response = await fetch(
      `https://api.justtcg.com/v1/cards?game=one-piece-card-game&q=${encodeURIComponent(cardName)}&limit=1`,
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error("JustTCG error:", response.status);
      return { price: null, image_url: null };
    }
    
    const data = await response.json();
    const cards = data.data || data || [];
    const card = Array.isArray(cards) ? cards[0] : null;
    
    if (!card) return { price: null, image_url: null };
    
    // Get highest price from variants
    let price = null;
    if (card.variants && Array.isArray(card.variants) && card.variants.length > 0) {
      const highestVariant = card.variants.reduce((max: any, v: any) => 
        (v.price || 0) > (max.price || 0) ? v : max, card.variants[0]);
      price = highestVariant?.price || null;
    }
    
    const image_url = card.image_url || card.image || card.images?.large;
    
    return { price, image_url };
  } catch (error) {
    console.error("JustTCG fetch error:", error);
    return { price: null, image_url: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching live market prices...");
    
    const results: PriceResult[] = [];
    
    // Process items in parallel batches
    const promises = GRAIL_ITEMS.map(async (item) => {
      let priceData: { price: number | null; image_url: string | null } = { price: null, image_url: null };
      
      switch (item.game) {
        case "magic":
          priceData = await fetchScryfallPrice(item.query, item.set);
          break;
        case "yugioh":
          priceData = await fetchYGOPrice(item.query);
          break;
        case "onepiece":
          priceData = await fetchJustTCGPrice(item.query);
          break;
        case "pokemon":
          // Pokemon prices require paid API, return null
          priceData = { price: null, image_url: null };
          break;
      }
      
      return {
        id: item.id,
        name: item.query,
        price: priceData.price,
        image_url: priceData.image_url,
        priceChange: (Math.random() - 0.5) * 5, // Simulated daily change
      };
    });
    
    const fetchedResults = await Promise.all(promises);
    results.push(...fetchedResults);
    
    console.log(`Fetched prices for ${results.length} items`);
    
    return new Response(
      JSON.stringify({ success: true, prices: results }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error fetching market prices:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch prices" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
