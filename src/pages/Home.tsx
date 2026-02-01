import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Radio } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { SupportedGames } from "@/components/home/SupportedGames";
import { TrendingSection } from "@/components/home/TrendingSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";
import { MarketTicker } from "@/components/home/MarketTicker";
import { GlobalFeed } from "@/components/home/GlobalFeed";
import { MarketHeatmap } from "@/components/home/MarketHeatmap";
import { ActiveStreamsWidget } from "@/components/live/ActiveStreamsWidget";

export default function Home() {
  const { user } = useAuth();

  // Landing page for non-logged-in users
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col cosmic-bg">
          <HeroSection />
          <SupportedGames />
          <TrendingSection />
          <CTASection />
          <Footer />
        </div>
      </Layout>
    );
  }

  // Dashboard for logged-in users
  return (
    <Layout>
      <div className="min-h-screen flex flex-col cosmic-bg">
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
