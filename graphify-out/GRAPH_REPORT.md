# Graph Report - C:\\Users\\samue\\novanode-platform  (2026-06-30)

## Corpus Check
- Corpus is ~38,352 words - fits in a single context window. You may not need a graph.

## Summary
- 189 nodes · 219 edges · 55 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 152 non-file, non-concept node(s)
- Weakly connected components: 50
- Singleton components: 25
- Isolated nodes: 25
- Largest component: 20 node(s) (13% of the entity graph basis)
- Low-cohesion communities: 0
- Largest low-cohesion community: none on the entity graph basis

## Workspace Bridges
1. `DashboardHome\(\)` - connects `App Dashboard Home — Dashboard`, `App Dashboard Home — Promo`, `App Dashboard Home — Refresh`, `App Dashboard Home — Staff`; home: `App Dashboard Home`; degree 17; score 2891.33
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/DashboardHome.tsx`
2. `KDSBoard\(\)` - connects `App Kds Board`, `App Kds Board — Close`, `App Time Ago`; home: `App Kds Board — Order`; degree 9; score 1415
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/kds/\[restaurant\_slug\]/components/KDSBoard.tsx`, `C:/Users/samue/novanode-platform/app/\(admin\)/kds/\[restaurant\_slug\]/components/TimeAgo.tsx`
3. `MenuManager\(\)` - connects `App Menu Manager — Item`; home: `App Menu Manager`; degree 10; score 1642.5
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/menu/components/MenuManager.tsx`
4. `MenuClient\(\)` - connects `App Menu Client — Client`; home: `App Menu Client`; degree 10; score 1553.5
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/components/MenuClient.tsx`
5. `SessionScreen\(\)` - connects `App Session — Check`; home: `App Session`; degree 5; score 839
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/session.tsx`
6. `StatusLabel\(\)` - connects `App Dashboard Home`; home: `App Dashboard Home — Dashboard`; degree 2; score 571.17
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/DashboardHome.tsx`, `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/StatsDashboard.tsx`

## God Nodes
1. `DashboardHome\(\)` - 19 edges
2. `layout /` - 12 edges
3. `MenuClient\(\)` - 12 edges
4. `MenuManager\(\)` - 12 edges
5. `KDSBoard\(\)` - 11 edges
6. `SuperAdminPanel\(\)` - 9 edges
7. `POST\(\)` - 7 edges
8. `QRGenerator\(\)` - 7 edges
9. `SessionScreen\(\)` - 7 edges
10. `ReceiptModal\(\)` - 5 edges

## Surprising Connections
- `layout /` --renders--> `AdminLayout\(\)`  [EXTRACTED]
  C:\\Users\\samue\\novanode-platform\\app\\layout.tsx → C:/Users/samue/novanode-platform/app/\(admin\)/layout.tsx  _connects across different repos/directories; peripheral node \`AdminLayout\(\)\` unexpectedly reaches hub \`layout /\`_
- `loading /\[restaurant\_slug\]` --renders--> `Loading\(\)`  [EXTRACTED]
  C:\\Users\\samue\\novanode-platform\\app\\\(customer\)\\\[restaurant\_slug\]\\loading.tsx → C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/loading.tsx  _connects across different repos/directories; bridges separate communities_
- `layout /` --renders--> `CustomerLayout\(\)`  [EXTRACTED]
  C:\\Users\\samue\\novanode-platform\\app\\layout.tsx → C:/Users/samue/novanode-platform/app/\(customer\)/layout.tsx  _connects across different repos/directories; peripheral node \`CustomerLayout\(\)\` unexpectedly reaches hub \`layout /\`_
- `page /novanode/login` --renders--> `NovaNodeLoginPage\(\)`  [EXTRACTED]
  C:\\Users\\samue\\novanode-platform\\app\\\(novanode\)\\novanode\\login\\page.tsx → C:/Users/samue/novanode-platform/app/\(novanode\)/novanode/login/page.tsx  _connects across different repos/directories; bridges separate communities_
- `layout /` --renders--> `RootLayout\(\)`  [EXTRACTED]
  C:\\Users\\samue\\novanode-platform\\app\\layout.tsx → C:/Users/samue/novanode-platform/app/layout.tsx  _connects across different repos/directories; peripheral node \`RootLayout\(\)\` unexpectedly reaches hub \`layout /\`_

## Semantic Anomalies
- **[HIGH] Bridge node** - DashboardHome\(\) bridges App Dashboard Home and App Dashboard Home — Dashboard, App Dashboard Home — Refresh, App Dashboard Home — Promo, App Dashboard Home — Staff, App Login Form.
  _High betweenness centrality \(2834.333\) across 6 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - layout / bridges App Layout and App Page — Menu, App Page, App Page — Kds, App Page — Home, App Page — Login, App, App Page — Suspended, App — Login, App Page — Admin.
  _High betweenness centrality \(1290.000\) across 10 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - KDSBoard\(\) bridges App Kds Board — Order and App Kds Board, App Kds Board — Close, App Time Ago, App Login Form.
  _High betweenness centrality \(1376.000\) across 5 communities makes this node a likely dependency chokepoint._
- **[HIGH] Cross-boundary edge** - loading /\[restaurant\_slug\] → Loading\(\) crosses graph boundaries in an unexpected way.
  _connects across different repos/directories; bridges separate communities_
- **[HIGH] Cross-boundary edge** - page /novanode/login → NovaNodeLoginPage\(\) crosses graph boundaries in an unexpected way.
  _connects across different repos/directories; bridges separate communities_

## Communities

### Community 0 - "App Menu Client"
Cohesion (entity basis within full-graph community): 0.2
Nodes (10): MenuClient\(\), addItem\(\), fetchPromos\(\), fetchStaff\(\), handleScroll\(\), placeOrder\(\), removeItem\(\), sendSignal\(\) (+2 more)

### Community 1 - "App Dashboard Home"
Cohesion (entity basis within full-graph community): 0.25
Nodes (8): DashboardHome\(\), checkClosingTime\(\), fetchAnalytics\(\), handleBannerUpload\(\), handleLogoUpload\(\), handleLogout\(\), saveProfile\(\), saveTheme\(\)

### Community 2 - "App Menu Manager"
Cohesion (entity basis within full-graph community): 0.25
Nodes (8): MenuManager\(\), deleteCategory\(\), deleteItem\(\), handleAutoTranslate\(\), handleImageUpload\(\), openEditItem\(\), saveCategory\(\), toggleAvailability\(\)

### Community 3 - "App Super Admin Panel"
Cohesion (entity basis within full-graph community): 0.25
Nodes (8): SuperAdminPanel\(\), clearOverdue\(\), handleLogout\(\), onboardRestaurant\(\), refreshCounts\(\), refreshTodayLedger\(\), toggleSuspend\(\), updateSessionFee\(\)

### Community 4 - "App Route"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): POST /api/admin/create-staff, POST /api/admin/onboard-restaurant, POST /api/admin/update-restaurant, POST /api/paystack/initialize, POST /api/paystack/webhook, POST /api/revalidate, POST\(\)

### Community 5 - "App Kds Board"
Cohesion (entity basis within full-graph community): 0
Nodes (5): KDSBoardProps, Signal, signalIcon\(\), signalLabel\(\), TimeEstimatePicker\(\)

### Community 6 - "App Kds Board — Order"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): KDSBoard\(\), checkClosingTime\(\), resolveSignal\(\), toggleStock\(\), updateOrderStatus\(\), updateOrderStatusWithTime\(\)

### Community 7 - "App Qr Generator"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): QRGenerator\(\), copyUrl\(\), downloadAll\(\), downloadQR\(\), printAll\(\), saveQRsToDatabase\(\)

### Community 8 - "App Layout"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): layout /, AdminLayout\(\), CustomerLayout\(\), RootLayout\(\)

### Community 9 - "App Dashboard Home — Dashboard"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): Props, StatusIcon\(\), StatusLabel\(\), StatsDashboard\(\)

### Community 10 - "App Login Form"
Cohesion (entity basis within full-graph community): 0.33
Nodes (3): LoginForm\(\), handleLogin\(\), PageProps

### Community 11 - "App Page"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): DashboardHome\(\), page /dashboard/\[restaurant\_slug\], DashboardPage\(\)

### Community 12 - "App Page — Menu"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): MenuManager\(\), page /dashboard/\[restaurant\_slug\]/menu, MenuPage\(\)

### Community 13 - "App Page — Kds"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): KDSBoard\(\), page /kds/\[restaurant\_slug\], KDSPage\(\)

### Community 14 - "App Page — Login"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): LoginForm\(\), page /login, LoginPage\(\)

### Community 15 - "App Page — Admin"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): SuperAdminPanel\(\), page /novanode, NovaNodeAdminPage\(\)

### Community 16 - "App Route — API"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): GET /api/analytics, GET /api/paystack/callback, GET\(\)

### Community 17 - "App Dashboard Home — Staff"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): addStaff\(\), deleteStaff\(\), fetchStaff\(\), updateStaffName\(\)

### Community 18 - "App Menu Client — Client"
Cohesion (entity basis within full-graph community): 0
Nodes (3): BillSplitter\(\), CartItem, MenuClientProps

### Community 19 - "App Receipt Modal"
Cohesion (entity basis within full-graph community): 0
Nodes (3): OrderItem, ReceiptModalProps, ReceiptOrder

### Community 20 - "App Receipt Modal — Receipt"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): ReceiptModal\(\), downloadPDF\(\), shareReceipt\(\), submitFeedback\(\)

### Community 21 - "App Session"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): SessionScreen\(\), adjustStarter\(\), handleStartersSubmit\(\), t\(\)

### Community 22 - "App Stats Dashboard"
Cohesion (entity basis within full-graph community): 0
Nodes (3): StatsProps, StatusIcon\(\), StatusLabel\(\)

### Community 23 - "App Page — Restaurant"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): RestaurantApp\(\), page /\[restaurant\_slug\], RestaurantMenuPage\(\)

### Community 24 - "App Page — Home"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /, Home\(\)

### Community 25 - "App Page — Suspended"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /\[restaurant\_slug\]/suspended, SuspendedPage\(\)

### Community 26 - "App Dashboard Home — Promo"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): deletePromo\(\), fetchPromos\(\), savePromo\(\)

### Community 27 - "App Menu Manager — Item"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): openAddItem\(\), resetForm\(\), saveItem\(\)

### Community 28 - "App Order Tracker"
Cohesion (entity basis within full-graph community): 0
Nodes (2): formatCountdown\(\), OrderTrackerProps

### Community 29 - "App Page — Login \(2\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): NovaNodeLoginInner\(\), handleLogin\(\), NovaNodeLoginPage\(\)

### Community 30 - "App Qr Generator — Qr"
Cohesion (entity basis within full-graph community): 0
Nodes (2): QRGeneratorProps, TableQR

### Community 31 - "Components Spotlight Layout"
Cohesion (entity basis within full-graph community): 0
Nodes (2): SpotlightLayout\(\), SpotlightLayoutProps

### Community 32 - "App Time Ago"
Cohesion (entity basis within full-graph community): 1
Nodes (2): TimeAgo\(\), update\(\)

### Community 33 - "App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): loading /\[restaurant\_slug\]

### Community 34 - "App — Login"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /novanode/login

### Community 35 - "App Dashboard Home — Refresh"
Cohesion (entity basis within full-graph community): 1
Nodes (2): refreshCounts\(\), refreshTodayRevenue\(\)

### Community 36 - "App Kds Board — Close"
Cohesion (entity basis within full-graph community): 1
Nodes (2): closeTable\(\), fetchLedger\(\)

### Community 37 - "App Loading"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Loading\(\)

### Community 38 - "App Menu Manager — Manager"
Cohesion (entity basis within full-graph community): 1
Nodes (1): MenuManagerProps

### Community 39 - "Public Next"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 40 - "App Order Tracker — Omit"
Cohesion (entity basis within full-graph community): 1
Nodes (2): Omit, TrackedOrder

### Community 41 - "App Order Tracker — Bell"
Cohesion (entity basis within full-graph community): 1
Nodes (2): OrderTracker\(\), pressDelayBell\(\)

### Community 42 - "Proxy"
Cohesion (entity basis within full-graph community): 1
Nodes (1): proxy\(\)

### Community 43 - "App Restaurant App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): RestaurantAppProps

### Community 44 - "App Restaurant App — App"
Cohesion (entity basis within full-graph community): 1
Nodes (2): RestaurantApp\(\), handleSessionReady\(\)

### Community 45 - "App Session — Session"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SessionScreenProps

### Community 46 - "App Session — Check"
Cohesion (entity basis within full-graph community): 1
Nodes (2): checkExistingSession\(\), handleNameSubmit\(\)

### Community 47 - "App Super Admin Panel — Admin"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SuperAdminPanelProps

### Community 48 - "Database Types TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 49 - "File SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 50 - "Globe SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 51 - "Index TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 52 - "Next Env D TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 53 - "Vercel SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 54 - "Window SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **114 weakly connected node(s):** `Props`, `StatusIcon\(\)`, `checkClosingTime\(\)`, `fetchAnalytics\(\)`, `handleLogout\(\)` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `App`** (2 nodes): `loading /\[restaurant\_slug\]`, `/\[restaurant\_slug\]`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App — Login`** (2 nodes): `page /novanode/login`, `/novanode/login`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Dashboard Home — Refresh`** (2 nodes): `refreshCounts\(\)`, `refreshTodayRevenue\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Kds Board — Close`** (2 nodes): `closeTable\(\)`, `fetchLedger\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Loading`** (2 nodes): `loading.tsx`, `Loading\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Menu Manager — Manager`** (2 nodes): `MenuManager.tsx`, `MenuManagerProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Public Next`** (2 nodes): `next.svg`, `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Order Tracker — Omit`** (2 nodes): `Omit`, `TrackedOrder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Order Tracker — Bell`** (2 nodes): `OrderTracker\(\)`, `pressDelayBell\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Proxy`** (2 nodes): `proxy.ts`, `proxy\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Restaurant App`** (2 nodes): `RestaurantApp.tsx`, `RestaurantAppProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Restaurant App — App`** (2 nodes): `RestaurantApp\(\)`, `handleSessionReady\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Session — Session`** (2 nodes): `session.tsx`, `SessionScreenProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Session — Check`** (2 nodes): `checkExistingSession\(\)`, `handleNameSubmit\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Super Admin Panel — Admin`** (2 nodes): `SuperAdminPanel.tsx`, `SuperAdminPanelProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Types TypeScript`** (1 nodes): `database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File SVG`** (1 nodes): `file.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe SVG`** (1 nodes): `globe.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Index TypeScript`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Env D TypeScript`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel SVG`** (1 nodes): `vercel.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Window SVG`** (1 nodes): `window.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does \`DashboardHome\(\)\` connect \`App Dashboard Home\` to \`App Dashboard Home — Dashboard\`, \`App Dashboard Home — Refresh\`, \`App Dashboard Home — Promo\`, \`App Dashboard Home — Staff\`, \`App Login Form\`?**
  _High betweenness centrality \(2834.333\) - this node is a cross-community bridge._
- **Why does \`MenuManager\(\)\` connect \`App Menu Manager\` to \`App Menu Manager — Manager\`, \`App Menu Manager — Item\`, \`App Login Form\`?**
  _High betweenness centrality \(1622.500\) - this node is a cross-community bridge._
- **Why does \`MenuClient\(\)\` connect \`App Menu Client\` to \`App Menu Client — Client\`, \`App Restaurant App\`?**
  _High betweenness centrality \(1533.500\) - this node is a cross-community bridge._
- **What connects \`Props\`, \`StatusIcon\(\)\`, \`checkClosingTime\(\)\` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
