

# Marketplace Feature Implementation Plan

## Overview
Create a new Marketplace tab where users can list their cards for sale and browse/purchase cards from other collectors. This will add a buy/sell functionality to the existing card collection system.

## What This Feature Will Include
- A new "Marketplace" page accessible from the navigation
- Ability for users to list their cards for sale with asking price
- Browse and filter listings from other users
- Contact sellers to arrange purchases
- Activity feed integration for new listings

---

## Database Changes

### New Table: `marketplace_listings`
A table to store cards that users want to sell:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| seller_id | uuid | References profiles.id |
| card_id | uuid | References user_cards.id (optional - for cards in collection) |
| card_name | text | Name of the card |
| image_url | text | Card image |
| tcg_game | tcg_game enum | Game type (pokemon, magic, etc.) |
| asking_price | numeric | Price the seller wants |
| condition | text | Card condition (Near Mint, Lightly Played, etc.) |
| description | text | Additional details |
| status | text | active, sold, cancelled |
| created_at | timestamp | When listed |
| updated_at | timestamp | Last update |

### Row-Level Security Policies
- Everyone can view active listings (SELECT)
- Authenticated users can create their own listings (INSERT)
- Users can update/delete only their own listings (UPDATE/DELETE)

### Update: Add `marvel` to tcg_game Enum
Since Marvel Non-Sport cards are supported in the scanner, the enum should include 'marvel' for consistency.

---

## New Files to Create

### 1. `src/pages/Marketplace.tsx`
Main marketplace page with:
- Tab navigation: "Browse All" | "My Listings"
- Filter bar: Game type, price range, condition
- Listings grid showing cards for sale
- "List a Card" button

### 2. `src/components/marketplace/ListingCard.tsx`
Individual listing display component:
- Card image with condition badge
- Card name and game type badge
- Asking price prominently displayed
- Seller info (avatar, username)
- "Contact Seller" or "View Details" button

### 3. `src/components/marketplace/CreateListingModal.tsx`
Modal for creating new listings:
- Select from existing collection OR enter card manually
- Set asking price
- Select condition (Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged)
- Add description/notes
- Preview before posting

### 4. `src/components/marketplace/ListingDetailModal.tsx`
Full listing details:
- Large card image
- All card details
- Seller profile preview
- "Message Seller" action (opens contact method)

### 5. `src/components/marketplace/MarketplaceFilters.tsx`
Filter controls:
- Game type dropdown (All, Pokemon, Magic, Yu-Gi-Oh, etc.)
- Price range slider or inputs
- Condition filter
- Sort options (newest, price low-high, price high-low)

---

## Navigation Updates

### `src/components/layout/Header.tsx`
Add marketplace to desktop navigation:
```
{ path: "/marketplace", icon: ShoppingBag, label: "Marketplace" }
```

### `src/components/layout/MobileNav.tsx`
Replace or add marketplace to mobile navigation (may need to reorganize 5 items to fit 6, or replace one)

### `src/App.tsx`
Add route:
```
<Route path="/marketplace" element={<Marketplace />} />
```

---

## UI/UX Design

### Visual Style
- Follow existing synthwave aesthetic with glass cards and neon accents
- Price tags with magenta/cyan glow effects
- "FOR SALE" badges on listed cards
- Status indicators (active = green glow, sold = dimmed)

### Layout
- Responsive grid similar to Collections page
- Compact card view for browsing many listings
- Quick-action hover states

---

## Technical Details

### Data Flow
1. User clicks "List a Card"
2. Modal opens showing their collection (or manual entry)
3. User selects card, sets price/condition
4. Listing saved to `marketplace_listings`
5. Activity feed entry created ("User listed [Card] for $X")
6. Listing appears in marketplace browse view

### Real-time Updates
- Subscribe to new listings for live updates
- Show "New listings available" toast when browsing

---

## Summary of Changes

| Type | Files |
|------|-------|
| Database | New `marketplace_listings` table with RLS policies |
| New Pages | `Marketplace.tsx` |
| New Components | `ListingCard.tsx`, `CreateListingModal.tsx`, `ListingDetailModal.tsx`, `MarketplaceFilters.tsx` |
| Updated Files | `Header.tsx`, `MobileNav.tsx`, `App.tsx` |

