import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Radio } from "lucide-react";
import { MarketTicker } from "@/components/home/MarketTicker";
import { EventsCalendarCompact } from "@/components/events/EventsCalendarCompact";
import { StoreLocator } from "@/components/home/StoreLocator";
import { MarketHeatmap } from "@/components/home/MarketHeatmap";
import { SetCountdown } from "@/components/home/SetCountdown";
import { ActiveStreamsWidget } from "@/components/live/ActiveStreamsWidget";
import { GlobalFeed } from "@/components/home/GlobalFeed";

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
        {/* Market Ticker - Holy Grails */}
        <MarketTicker />

        <div className="container mx-auto px-4 flex-grow">
          {/* Welcome Banner */}
          {!user && (
            <div className="glass-card p-8 mb-6 text-center neon-border-cyan fade-in">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Welcome to CollectingTCG
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                The ultimate social platform for trading card game collectors. Capture cards, build your collection, and connect with fellow collectors.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:neon-glow-cyan transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Row 1: Global Feed (prominent, wide) */}
            <div className="col-span-full lg:col-span-4 xl:col-span-4 min-h-[400px]">
              <GlobalFeed />
            </div>

            {/* Right side widgets */}
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 space-y-4">
              {/* Market Heatmap */}
              <div className="min-h-[120px]">
                <MarketHeatmap />
              </div>

              {/* Live Streams */}
              <div className="min-h-[160px]">
                <div className="glass-card p-4 neon-border-magenta h-full">
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-secondary animate-pulse" />
                    Live Streams
                  </h2>
                  <ActiveStreamsWidget />
                </div>
              </div>
            </div>

            {/* Row 2: Set Countdown + Events Calendar */}
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-3 min-h-[200px]">
              <SetCountdown />
            </div>

            <div className="md:col-span-2 lg:col-span-2 xl:col-span-3 min-h-[200px]">
              <EventsCalendarCompact />
            </div>

            {/* Row 3: Store Locator (full width, at the bottom) */}
            <div className="col-span-full min-h-[300px]">
              <StoreLocator />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}