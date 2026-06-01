# Graph Report - novanode-platform  (2026-06-01)

## Corpus Check
- 48 files · ~25,898 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 257 nodes · 347 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89d83535`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Tables` - 14 edges
3. `createClient()` - 13 edges
4. `ctx()` - 9 edges
5. `RestaurantMenuPage()` - 6 edges
6. `createClient()` - 6 edges
7. `RestaurantStats` - 6 edges
8. `MenuItemStats` - 6 edges
9. `PeakHourStats` - 6 edges
10. `Props` - 5 edges

## Surprising Connections (you probably didn't know these)
- `RestaurantMenuPage()` --calls--> `getCategories`  [INFERRED]
  app/(customer)/[restaurant_slug]/page.tsx → lib/cache.ts
- `RestaurantMenuPage()` --calls--> `getDailySpecial`  [INFERRED]
  app/(customer)/[restaurant_slug]/page.tsx → lib/cache.ts
- `RestaurantMenuPage()` --calls--> `getMenuItems`  [INFERRED]
  app/(customer)/[restaurant_slug]/page.tsx → lib/cache.ts
- `RestaurantMenuPage()` --calls--> `getRestaurantBySlug`  [INFERRED]
  app/(customer)/[restaurant_slug]/page.tsx → lib/cache.ts
- `RestaurantMenuPage()` --calls--> `getStarters`  [INFERRED]
  app/(customer)/[restaurant_slug]/page.tsx → lib/cache.ts

## Import Cycles
- None detected.

## Communities (23 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (23): PageProps, Order, Props, Restaurant, Session, Tab, Order, Period (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (15): QRGeneratorProps, Restaurant, TableQR, OrderItem, ReceiptModalProps, ReceiptOrder, Restaurant, StaffMember (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (21): CartItem, Category, DailySpecial, MenuClientProps, MenuItem, Restaurant, Signal, Order (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (14): Category, DailySpecial, MenuItem, Restaurant, RestaurantAppProps, SpotlightLayoutProps, generateFingerprint(), generateToken() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (20): dependencies, jspdf, lucide-react, next, next-intl, qrcode, qrcode.react, react (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (12): KDSBoardProps, KDSTab, MenuItem, Order, OrderStatus, Restaurant, Session, Signal (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.20
Nodes (13): PageProps, getCategories, getDailySpecial, getMenuItems, getRestaurantBySlug, getStarters, supabase, config (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (3): PageProps, PageProps, createClient()

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, supabase, tailwindcss, @tailwindcss/postcss, @types/node, @types/qrcode (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (7): Category, MenuItem, MenuManagerProps, Restaurant, View, compressImage(), uploadMenuImage()

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (4): name, organization_id, organization_slug, ref

### Community 13 - "Community 13"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **131 isolated node(s):** `Restaurant`, `Order`, `Session`, `Tab`, `Restaurant` (+126 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tables` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 10`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 10`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `Restaurant`, `Order`, `Session` to the rest of the system?**
  _131 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0944741532976827 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07459677419354839 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._