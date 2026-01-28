import { useEffect, useState } from "react";
import { MapPin, Navigation, Calendar, Store, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface GameStore {
  id: string;
  name: string;
  address: string;
  distance: number;
  lat: number;
  lng: number;
  events: { id: string; title: string; date: string }[];
}

// Mock store data - in production, this would come from an API
const MOCK_STORES: Omit<GameStore, "distance">[] = [
  {
    id: "1",
    name: "Card Kingdom",
    address: "5105 Leary Ave NW, Seattle, WA",
    lat: 47.6656,
    lng: -122.3776,
    events: [],
  },
  {
    id: "2",
    name: "Channel Fireball",
    address: "2980 Scott Blvd, Santa Clara, CA",
    lat: 37.3541,
    lng: -121.9552,
    events: [],
  },
  {
    id: "3",
    name: "TCGPlayer Direct",
    address: "120 Washington Ave, Syracuse, NY",
    lat: 43.0481,
    lng: -76.1474,
    events: [],
  },
  {
    id: "4",
    name: "Cool Stuff Inc",
    address: "12870 Automobile Blvd, Clearwater, FL",
    lat: 27.9075,
    lng: -82.6827,
    events: [],
  },
  {
    id: "5",
    name: "Star City Games",
    address: "5728 Williamson Rd, Roanoke, VA",
    lat: 37.3118,
    lng: -79.9553,
    events: [],
  },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function StoreLocator() {
  const [stores, setStores] = useState<GameStore[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; title: string; start_date: string }[]>([]);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocationError("Location access denied. Showing default stores.");
          // Default to center of US
          setUserLocation({ lat: 39.8283, lng: -98.5795 });
        }
      );
    } else {
      setLocationError("Geolocation not supported.");
      setUserLocation({ lat: 39.8283, lng: -98.5795 });
    }

    // Fetch upcoming events from database
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (userLocation) {
      const storesWithDistance = MOCK_STORES.map((store) => ({
        ...store,
        distance: calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng),
        events: upcomingEvents.slice(0, 2).map((e) => ({ id: e.id, title: e.title, date: e.start_date })),
      })).sort((a, b) => a.distance - b.distance);

      setStores(storesWithDistance);
      setLoading(false);
    }
  }, [userLocation, upcomingEvents]);

  const fetchUpcomingEvents = async () => {
    const { data } = await supabase
      .from("tournament_events")
      .select("id, title, start_date")
      .gte("start_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true })
      .limit(4);

    if (data) {
      setUpcomingEvents(data);
    }
  };

  return (
    <div className="glass-card p-4 neon-border-cyan h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          Local Game Stores
        </h2>
        {userLocation && !locationError && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            Near you
          </span>
        )}
      </div>

      {locationError && (
        <p className="text-xs text-muted-foreground mb-3">{locationError}</p>
      )}

      {/* Map Placeholder - OpenStreetMap embed */}
      <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4 bg-muted/30">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <iframe
            title="Store Map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              userLocation ? `${userLocation.lng - 2}%2C${userLocation.lat - 1}%2C${userLocation.lng + 2}%2C${userLocation.lat + 1}` : "-125%2C24%2C-66%2C50"
            }&layer=mapnik&marker=${userLocation?.lat || 39.8283}%2C${userLocation?.lng || -98.5795}`}
            className="rounded-lg"
          />
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/50 to-transparent" />
      </div>

      {/* Store List */}
      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>
          ))
        ) : (
          stores.slice(0, 4).map((store) => (
            <div
              key={store.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs truncate">{store.name}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{store.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-primary font-medium">
                    {store.distance.toFixed(1)} mi
                  </span>
                  {store.events.length > 0 && (
                    <span className="text-[10px] text-secondary flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {store.events.length} events
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All Link */}
      <Link
        to="/events"
        className="mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        View all events <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
