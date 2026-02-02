import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { SupportedGames } from "@/components/home/SupportedGames";
import { TrendingSection } from "@/components/home/TrendingSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
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
