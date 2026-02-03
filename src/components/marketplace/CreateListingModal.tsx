import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Check, Camera, Upload, X, Minus, HandCoins } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CardCondition, ListingType, CardRarity } from "./types";
import { conditionLabels, listingTypeLabels, rarityLabels } from "./types";
import type { Database } from "@/integrations/supabase/types";

type TcgGame = Database['public']['Enums']['tcg_game'];

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    card_id?: string;
    card_name: string;
    image_url?: string;
    images?: string[];
    tcg_game: TcgGame;
    asking_price: number;
    condition: CardCondition;
    listing_type?: ListingType;
    rarity?: CardRarity;
    rarity_custom?: string;
    quantity?: number;
    description?: string;
    accepts_offers?: boolean;
  }) => void;
  isSubmitting?: boolean;
}

const games = [
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'magic', label: 'Magic: The Gathering' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'lorcana', label: 'Lorcana' },
  { value: 'dragonball', label: 'Dragon Ball' },
  { value: 'unionarena', label: 'Union Arena' },
  { value: 'marvel', label: 'Marvel' },
  { value: 'starwars', label: 'Star Wars' },
];

const MAX_IMAGES = 10;

export function CreateListingModal({ open, onOpenChange, onSubmit, isSubmitting }: CreateListingModalProps) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'collection' | 'manual'>('manual');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual entry state
  const [cardName, setCardName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tcgGame, setTcgGame] = useState<TcgGame | ''>('');
  
  // New fields
  const [listingType, setListingType] = useState<ListingType>('single');
  const [rarity, setRarity] = useState<CardRarity | ''>('');
  const [rarityCustom, setRarityCustom] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Common fields
  const [askingPrice, setAskingPrice] = useState('');
  const [condition, setCondition] = useState<CardCondition>('near_mint');
  const [description, setDescription] = useState('');
  const [acceptsOffers, setAcceptsOffers] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch user's cards
  const { data: userCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['user-cards-for-listing', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && open,
  });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    if (filesToProcess.length === 0) return;
    
    setIsUploadingImage(true);
    
    // Process all files and wait for all to complete
    const imagePromises = filesToProcess
      .filter(file => file.type.startsWith("image/"))
      .map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
    
    try {
      const newImages = await Promise.all(imagePromises);
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Error reading image files:', error);
    }
    
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(100, prev + delta)));
  };

  const handleSubmit = () => {
    const price = parseFloat(askingPrice);
    if (isNaN(price) || price <= 0) return;

    if (tab === 'collection' && selectedCard) {
      onSubmit({
        card_id: selectedCard.id,
        card_name: selectedCard.card_name,
        image_url: selectedCard.image_url,
        images: [],
        tcg_game: (selectedCard.tcg_game || 'pokemon') as TcgGame,
        asking_price: price,
        condition,
        listing_type: listingType,
        rarity: rarity || undefined,
        rarity_custom: rarity === 'other' ? rarityCustom : undefined,
        quantity,
        description: description || undefined,
        accepts_offers: acceptsOffers,
      });
    } else if (tab === 'manual' && cardName && tcgGame) {
      onSubmit({
        card_name: cardName,
        image_url: images[0] || undefined,
        images: images,
        tcg_game: tcgGame,
        asking_price: price,
        condition,
        listing_type: listingType,
        rarity: rarity || undefined,
        rarity_custom: rarity === 'other' ? rarityCustom : undefined,
        quantity,
        description: description || undefined,
        accepts_offers: acceptsOffers,
      });
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setSelectedCard(null);
    setCardName('');
    setImages([]);
    setTcgGame('');
    setListingType('single');
    setRarity('');
    setRarityCustom('');
    setQuantity(1);
    setAskingPrice('');
    setCondition('near_mint');
    setDescription('');
    setAcceptsOffers(true);
  };

  const isValid = 
    (tab === 'collection' && selectedCard && askingPrice) ||
    (tab === 'manual' && cardName && tcgGame && askingPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Create New Listing
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-background/50">
            <TabsTrigger value="manual">
              <Camera className="w-4 h-4 mr-2" />
              Photo Listing
            </TabsTrigger>
            <TabsTrigger value="collection">From Collection</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Photos (up to {MAX_IMAGES})</Label>
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Add</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title / Card Name *</Label>
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g., Charizard VMAX or Pokemon Lot"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Game / Category *</Label>
                <Select value={tcgGame} onValueChange={(v) => setTcgGame(v as TcgGame)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select game" />
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
            </div>
          </TabsContent>

          <TabsContent value="collection" className="space-y-4 mt-4">
            <Label>Select a card from your collection</Label>
            {cardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : userCards?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No cards in your collection yet.
              </p>
            ) : (
              <ScrollArea className="h-48 rounded-lg border border-border bg-background/30 p-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {userCards?.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={cn(
                        "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
                        selectedCard?.id === card.id
                          ? "border-primary neon-glow-cyan"
                          : "border-transparent hover:border-primary/50"
                      )}
                    >
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-center p-1">
                          {card.card_name}
                        </div>
                      )}
                      {selectedCard?.id === card.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedCard && (
              <p className="text-sm text-primary">
                Selected: {selectedCard.card_name}
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Listing Type */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Listing Type *</Label>
            <Select value={listingType} onValueChange={(v) => setListingType(v as ListingType)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {(Object.keys(listingTypeLabels) as ListingType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {listingTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(100, val)));
                }}
                type="number"
                min="1"
                max="100"
                className="bg-background/50 text-center w-20"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 100}
                className="h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Price, Condition, Rarity */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Asking Price ($) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="0.00"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Condition *</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as CardCondition)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {(Object.keys(conditionLabels) as CardCondition[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {conditionLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rarity</Label>
            <Select value={rarity || 'none'} onValueChange={(v) => setRarity(v === 'none' ? '' : v as CardRarity)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">Not specified</SelectItem>
                {(Object.keys(rarityLabels) as CardRarity[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {rarityLabels[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Rarity Input */}
        {rarity === 'other' && (
          <div className="space-y-2 mt-4">
            <Label>Custom Rarity</Label>
            <Input
              value={rarityCustom}
              onChange={(e) => setRarityCustom(e.target.value)}
              placeholder="Enter custom rarity"
              className="bg-background/50"
            />
          </div>
        )}

        <div className="space-y-2 mt-4">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={listingType === 'lot' || listingType === 'bundle' 
              ? "Describe what's included in this lot/bundle..." 
              : "Add any additional details about the card..."
            }
            className="bg-background/50 min-h-[80px]"
          />
        </div>

        {/* Accept Offers Toggle */}
        <div className="flex items-center justify-between mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            <div>
              <Label htmlFor="accepts-offers" className="text-sm font-medium cursor-pointer">
                Accept Best Offers
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow buyers to submit custom offers
              </p>
            </div>
          </div>
          <Switch
            id="accepts-offers"
            checked={acceptsOffers}
            onCheckedChange={setAcceptsOffers}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
