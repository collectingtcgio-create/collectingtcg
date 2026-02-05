import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { SupportedGames } from "@/components/home/SupportedGames";
import { TrendingSection } from "@/components/home/TrendingSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";
import { FriendRequestsWidget } from "@/components/profile/FriendRequestsWidget";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
        {/* Friend Requests Widget for logged-in users */}
        {user && (
          <div className="container mx-auto px-4 mt-4">
            <div className="max-w-md">
              <FriendRequestsWidget />
            </div>
          </div>
        )}

        <HeroSection />



        <SupportedGames />
        <TrendingSection />
        <CTASection />
        <Footer />
      </div>
    </Layout>
  );
}
