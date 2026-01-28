import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import type { CardCondition } from "./types";
import { conditionLabels } from "./types";

interface MarketplaceFiltersProps {
  game: string;
  onGameChange: (game: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  condition: CardCondition | '';
  onConditionChange: (condition: CardCondition | '') => void;
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  onSortByChange: (sort: 'newest' | 'price_asc' | 'price_desc') => void;
  onClearFilters: () => void;
}

const games = [
  { value: 'all', label: 'All Games' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'magic', label: 'Magic: The Gathering' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'lorcana', label: 'Lorcana' },
  { value: 'dragonball', label: 'Dragon Ball' },
  { value: 'unionarena', label: 'Union Arena' },
  { value: 'marvel', label: 'Marvel' },
];

export function MarketplaceFilters({
  game,
  onGameChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  condition,
  onConditionChange,
  sortBy,
  onSortByChange,
  onClearFilters,
}: MarketplaceFiltersProps) {
  const hasActiveFilters = game !== 'all' || minPrice || maxPrice || condition;

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-semibold">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Game Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Game</Label>
          <Select value={game} onValueChange={onGameChange}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="All Games" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {games.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Price */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Min Price</Label>
          <Input
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* Max Price */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Max Price</Label>
          <Input
            type="number"
            placeholder="$∞"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* Condition Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Condition</Label>
          <Select value={condition} onValueChange={(v) => onConditionChange(v as CardCondition | '')}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="">Any Condition</SelectItem>
              {(Object.keys(conditionLabels) as CardCondition[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {conditionLabels[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort By</Label>
          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as any)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
