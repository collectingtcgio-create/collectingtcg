import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, Users, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_live: boolean;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    const { data } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, is_live")
      .ilike("username", `%${query}%`)
      .limit(20);

    setResults(data || []);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Find Players
          </h1>
          <p className="text-muted-foreground">
            Search for collectors and connect with the community
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="glass-card p-4 neon-border-cyan flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full px-6 bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No players found matching "{query}"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Link
                key={result.id}
                to={`/profile/${result.id}`}
                className="block"
              >
                <div
                  className="glass-card p-4 hover:neon-border-cyan transition-all duration-300 fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`relative ${result.is_live ? "live-border" : ""}`}>
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {result.avatar_url ? (
                          <img
                            src={result.avatar_url}
                            alt={result.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-muted-foreground">
                            {result.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{result.username}</h3>
                        {result.is_live && (
                          <span className="px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.bio || "No bio"}
                      </p>
                    </div>

                    {/* View Button */}
                    <Button
                      variant="ghost"
                      className="rounded-full hover:bg-primary/10 hover:text-primary"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find Your Community</h3>
            <p className="text-muted-foreground">
              Search for other collectors by username to connect and follow
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
