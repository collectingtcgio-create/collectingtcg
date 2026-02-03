import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X, Search } from "lucide-react";
import type { CardCondition, ListingType, CardRarity } from "./types";
import { conditionLabels, listingTypeLabels, rarityLabels } from "./types";

interface MarketplaceFiltersProps {
  game: string;
  onGameChange: (game: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  condition: CardCondition | '';
  onConditionChange: (condition: CardCondition | '') => void;
  listingType: ListingType | '';
  onListingTypeChange: (type: ListingType | '') => void;
  rarity: CardRarity | '';
  onRarityChange: (rarity: CardRarity | '') => void;
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  onSortByChange: (sort: 'newest' | 'price_asc' | 'price_desc') => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
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
  listingType,
  onListingTypeChange,
  rarity,
  onRarityChange,
  sortBy,
  onSortByChange,
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
}: MarketplaceFiltersProps) {
  const hasActiveFilters = game !== 'all' || minPrice || maxPrice || condition || listingType || rarity || searchQuery;

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      {/* Search Bar - Prominent at top */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search cards, sets, or keywords... (fuzzy matching enabled)"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-10 pr-4 py-3 text-base bg-background/50 border-border h-12"
        />
      </div>

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
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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

        {/* Listing Type Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={listingType || 'all'} onValueChange={(v) => onListingTypeChange(v === 'all' ? '' : v as ListingType)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(listingTypeLabels) as ListingType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {listingTypeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rarity Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Rarity</Label>
          <Select value={rarity || 'all'} onValueChange={(v) => onRarityChange(v === 'all' ? '' : v as CardRarity)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Any Rarity" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">Any Rarity</SelectItem>
              {(Object.keys(rarityLabels) as CardRarity[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {rarityLabels[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Condition</Label>
          <Select value={condition || 'all'} onValueChange={(v) => onConditionChange(v === 'all' ? '' : v as CardCondition)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">Any Condition</SelectItem>
              {(Object.keys(conditionLabels) as CardCondition[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {conditionLabels[c]}
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
