import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Radio } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { MarketTicker } from "@/components/home/MarketTicker";
import { GlobalFeed } from "@/components/home/GlobalFeed";
import { MarketHeatmap } from "@/components/home/MarketHeatmap";
import { ActiveStreamsWidget } from "@/components/live/ActiveStreamsWidget";

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen flex flex-col cosmic-bg">
        {/* Hero Section - only show when not logged in */}
        {!user && <HeroSection />}

        {/* Holy Grails Market - horizontal featured cards */}
        <MarketTicker />

        {/* Main Dashboard Content */}
        <div className="container mx-auto px-4 py-8 flex-grow">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Global Feed (wider) */}
            <div className="lg:col-span-2">
              <GlobalFeed />
            </div>

            {/* Right column - Widgets */}
            <div className="space-y-6">
              {/* Market Heatmap - engagement trends */}
              <MarketHeatmap />

              {/* Live Streams */}
              <div className="glass-card p-5">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-secondary animate-pulse" />
                  Live Streams
                </h2>
                <ActiveStreamsWidget />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
