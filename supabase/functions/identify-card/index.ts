import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Sample card database for simulation - mix of One Piece and Pokémon cards
const SAMPLE_CARDS = [
  {
    card_name: "Monkey D. Luffy",
    set_name: "Romance Dawn",
    rarity: "Super Rare",
    card_number: "OP01-003",
    image_url: "https://images.pokemontcg.io/base1/4.png", // Placeholder
    price_estimate: 45.99,
  },
  {
    card_name: "Charizard VMAX",
    set_name: "Champion's Path",
    rarity: "Secret Rare",
    card_number: "074/073",
    image_url: "https://images.pokemontcg.io/swsh35/74_hires.png",
    price_estimate: 189.99,
  },
  {
    card_name: "Pikachu V",
    set_name: "Vivid Voltage",
    rarity: "Ultra Rare",
    card_number: "043/185",
    image_url: "https://images.pokemontcg.io/swsh4/43_hires.png",
    price_estimate: 12.50,
  },
  {
    card_name: "Roronoa Zoro",
    set_name: "Paramount War",
    rarity: "Leader",
    card_number: "OP02-001",
    image_url: "https://images.pokemontcg.io/base1/15.png", // Placeholder
    price_estimate: 32.00,
  },
  {
    card_name: "Mewtwo GX",
    set_name: "Shining Legends",
    rarity: "GX",
    card_number: "39/73",
    image_url: "https://images.pokemontcg.io/sm35/39_hires.png",
    price_estimate: 24.99,
  },
  {
    card_name: "Nami",
    set_name: "Romance Dawn",
    rarity: "Rare",
    card_number: "OP01-016",
    image_url: "https://images.pokemontcg.io/base1/64.png", // Placeholder
    price_estimate: 8.75,
  },
  {
    card_name: "Umbreon VMAX",
    set_name: "Evolving Skies",
    rarity: "Alternate Art Secret",
    card_number: "215/203",
    image_url: "https://images.pokemontcg.io/swsh7/215_hires.png",
    price_estimate: 425.00,
  },
  {
    card_name: "Shanks",
    set_name: "Paramount War",
    rarity: "Secret Rare",
    card_number: "OP02-120",
    image_url: "https://images.pokemontcg.io/base1/2.png", // Placeholder
    price_estimate: 89.99,
  },
];

interface RequestBody {
  image_data?: string; // Base64 encoded image
  mode?: "simulate" | "identify"; // For future API integration
}

interface CardResult {
  card_name: string;
  set_name?: string;
  rarity?: string;
  card_number?: string;
  image_url: string | null;
  price_estimate: number | null;
  confidence?: number;
}

interface ApiResponse {
  success: boolean;
  card?: CardResult;
  error?: string;
  processing_time_ms?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const body: RequestBody = await req.json();
    const { image_data, mode = "simulate" } = body;

    // Validate image data is provided
    if (!image_data) {
      return new Response(
        JSON.stringify({ success: false, error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate base64 format
    if (!image_data.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image format. Expected base64 data URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: CardResult;

    if (mode === "identify") {
      // FUTURE: Integration with external image recognition API
      // Example structure for Google Vision or Perplexity API:
      //
      // const visionResponse = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${Deno.env.get('GOOGLE_VISION_API_KEY')}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     requests: [{
      //       image: { content: image_data.split(',')[1] },
      //       features: [
      //         { type: 'TEXT_DETECTION' },
      //         { type: 'WEB_DETECTION' },
      //       ],
      //     }],
      //   }),
      // });
      //
      // const visionData = await visionResponse.json();
      // Parse the response and match against card database...

      // For now, fall back to simulation
      result = SAMPLE_CARDS[Math.floor(Math.random() * SAMPLE_CARDS.length)];
    } else {
      // SIMULATION MODE: Return a random card
      // Simulate processing delay (200-800ms)
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));
      
      // Simulate occasional "no card detected" (10% chance)
      if (Math.random() < 0.1) {
        const processingTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({
            success: false,
            error: "No card detected in image",
            processing_time_ms: processingTime,
          } as ApiResponse),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return a random sample card
      result = {
        ...SAMPLE_CARDS[Math.floor(Math.random() * SAMPLE_CARDS.length)],
        confidence: 0.85 + Math.random() * 0.14, // 85-99% confidence
      };
    }

    const processingTime = Date.now() - startTime;

    const response: ApiResponse = {
      success: true,
      card: result,
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
      } as ApiResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
