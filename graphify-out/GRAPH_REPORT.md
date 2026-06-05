# Graph Report - C:\\Users\\samue\\novanode-platform  (2026-06-05)

## Corpus Check
- Corpus is ~25,284 words - fits in a single context window. You may not need a graph.

## Summary
- 164 nodes · 186 edges · 50 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 128 non-file, non-concept node(s)
- Weakly connected components: 54
- Singleton components: 29
- Isolated nodes: 29
- Largest component: 10 node(s) (8% of the entity graph basis)
- Low-cohesion communities: 0
- Largest low-cohesion community: none on the entity graph basis

## Workspace Bridges
1. `MenuManager\(\)` - connects `App Menu Manager — Item`; home: `App Menu Manager`; degree 9; score 1267.5
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/menu/components/MenuManager.tsx`
2. `KDSBoard\(\)` - connects `App Kds Board`; home: `App Kds Board — Order`; degree 7; score 925.5
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/kds/\[restaurant\_slug\]/components/KDSBoard.tsx`
3. `DashboardHome\(\)` - connects `App Dashboard Home`; home: `App Dashboard Home — Refresh`; degree 4; score 705.5
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/DashboardHome.tsx`
4. `SessionScreen\(\)` - connects `App Session — Check`; home: `App Session`; degree 4; score 579
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/session.tsx`
5. `StatusLabel\(\)` - connects `App Dashboard Home — Refresh`; home: `App Dashboard Home`; degree 2; score 469.5
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/DashboardHome.tsx`, `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/StatsDashboard.tsx`
6. `NovaNodeLoginPage\(\)` - connects `App — Login`; home: `App Page — Login \(2\)`; degree 2; score 326.78
  source files: `C:/Users/samue/novanode-platform/app/\(novanode\)/novanode/login/page.tsx`, `C:\\Users\\samue\\novanode-platform\\app\\\(novanode\)\\novanode\\login\\page.tsx`

## God Nodes
1. `layout /` - 12 edges
2. `MenuManager\(\)` - 11 edges
3. `KDSBoard\(\)` - 9 edges
4. `SuperAdminPanel\(\)` - 8 edges
5. `MenuClient\(\)` - 7 edges
6. `QRGenerator\(\)` - 7 edges
7. `DashboardHome\(\)` - 6 edges
8. `SessionScreen\(\)` - 6 edges
9. `ReceiptModal\(\)` - 5 edges
10. `POST\(\)` - 4 edges

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
- **[HIGH] Bridge node** - layout / bridges App Layout and App Page — Menu, App Page, App Page — Kds, App Page — Home, App Page — Login, App, App — Login, App Page — Admin, App Page — Suspended.
  _High betweenness centrality \(1146.000\) across 10 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - MenuManager\(\) bridges App Menu Manager and App Menu Manager — Manager, App Menu Manager — Item, App Login Form.
  _High betweenness centrality \(1248.500\) across 4 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - KDSBoard\(\) bridges App Kds Board — Order and App Kds Board, App Login Form.
  _High betweenness centrality \(908.500\) across 3 communities makes this node a likely dependency chokepoint._
- **[HIGH] Cross-boundary edge** - loading /\[restaurant\_slug\] → Loading\(\) crosses graph boundaries in an unexpected way.
  _connects across different repos/directories; bridges separate communities_
- **[HIGH] Cross-boundary edge** - page /novanode/login → NovaNodeLoginPage\(\) crosses graph boundaries in an unexpected way.
  _connects across different repos/directories; bridges separate communities_

## Communities

### Community 0 - "App Kds Board"
Cohesion (entity basis within full-graph community): 0
Nodes (6): KDSBoardProps, Signal, signalIcon\(\), signalLabel\(\), timeAgo\(\), TimeEstimatePicker\(\)

### Community 1 - "App Kds Board — Order"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): KDSBoard\(\), closeTable\(\), resolveSignal\(\), TimeAgo\(\), toggleStock\(\), updateOrderStatus\(\), updateOrderStatusWithTime\(\)

### Community 2 - "App Menu Manager"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): MenuManager\(\), deleteCategory\(\), deleteItem\(\), handleImageUpload\(\), openEditItem\(\), saveCategory\(\), toggleAvailability\(\)

### Community 3 - "App Super Admin Panel"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): SuperAdminPanel\(\), clearOverdue\(\), handleLogout\(\), onboardRestaurant\(\), refreshTodayLedger\(\), toggleSuspend\(\), updateSessionFee\(\)

### Community 4 - "App Menu Client"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): BillSplitter\(\), MenuClient\(\), addItem\(\), placeOrder\(\), removeItem\(\), sendSignal\(\)

### Community 5 - "App Qr Generator"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): QRGenerator\(\), copyUrl\(\), downloadAll\(\), downloadQR\(\), printAll\(\), saveQRsToDatabase\(\)

### Community 6 - "App Layout"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): layout /, AdminLayout\(\), CustomerLayout\(\), RootLayout\(\)

### Community 7 - "App Dashboard Home"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): Props, StatusIcon\(\), StatusLabel\(\), StatsDashboard\(\)

### Community 8 - "App Login Form"
Cohesion (entity basis within full-graph community): 0.33
Nodes (3): LoginForm\(\), handleLogin\(\), PageProps

### Community 9 - "App Page"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): DashboardHome\(\), page /dashboard/\[restaurant\_slug\], DashboardPage\(\)

### Community 10 - "App Page — Menu"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): MenuManager\(\), page /dashboard/\[restaurant\_slug\]/menu, MenuPage\(\)

### Community 11 - "App Page — Kds"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): KDSBoard\(\), page /kds/\[restaurant\_slug\], KDSPage\(\)

### Community 12 - "App Page — Login"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): LoginForm\(\), page /login, LoginPage\(\)

### Community 13 - "App Page — Admin"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): SuperAdminPanel\(\), page /novanode, NovaNodeAdminPage\(\)

### Community 14 - "App Route"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): POST /api/admin/create-staff, POST /api/paystack/initialize, POST /api/paystack/webhook, POST\(\)

### Community 15 - "App Dashboard Home — Refresh"
Cohesion (entity basis within full-graph community): 0.67
Nodes (4): DashboardHome\(\), handleLogout\(\), refreshCounts\(\), refreshTodayRevenue\(\)

### Community 16 - "Types Database Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): MenuItemStats, PeakHourStats, RestaurantStats

### Community 17 - "App Receipt Modal"
Cohesion (entity basis within full-graph community): 0
Nodes (3): OrderItem, ReceiptModalProps, ReceiptOrder

### Community 18 - "App Receipt Modal — Receipt"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): ReceiptModal\(\), downloadPDF\(\), shareReceipt\(\), submitFeedback\(\)

### Community 19 - "App Stats Dashboard"
Cohesion (entity basis within full-graph community): 0
Nodes (3): StatsProps, StatusIcon\(\), StatusLabel\(\)

### Community 20 - "App Page — Restaurant"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): RestaurantApp\(\), page /\[restaurant\_slug\], RestaurantMenuPage\(\)

### Community 21 - "App Page — Home"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /, Home\(\)

### Community 22 - "App Page — Suspended"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /suspended, SuspendedPage\(\)

### Community 23 - "App Route — API"
Cohesion (entity basis within full-graph community): 1
Nodes (2): GET /api/paystack/callback, GET\(\)

### Community 24 - "App Menu Client — Client"
Cohesion (entity basis within full-graph community): 0
Nodes (2): CartItem, MenuClientProps

### Community 25 - "App Menu Manager — Item"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): openAddItem\(\), resetForm\(\), saveItem\(\)

### Community 26 - "App Order Tracker"
Cohesion (entity basis within full-graph community): 0
Nodes (2): formatCountdown\(\), OrderTrackerProps

### Community 27 - "App Page — Login \(2\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): NovaNodeLoginInner\(\), handleLogin\(\), NovaNodeLoginPage\(\)

### Community 28 - "App Qr Generator — Qr"
Cohesion (entity basis within full-graph community): 0
Nodes (2): QRGeneratorProps, TableQR

### Community 29 - "App Session"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): SessionScreen\(\), adjustStarter\(\), handleStartersSubmit\(\)

### Community 30 - "Components Spotlight Layout"
Cohesion (entity basis within full-graph community): 0
Nodes (2): SpotlightLayout\(\), SpotlightLayoutProps

### Community 31 - "App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): loading /\[restaurant\_slug\]

### Community 32 - "App — Login"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /novanode/login

### Community 33 - "App Loading"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Loading\(\)

### Community 34 - "App Menu Manager — Manager"
Cohesion (entity basis within full-graph community): 1
Nodes (1): MenuManagerProps

### Community 35 - "Public Next"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 36 - "App Order Tracker — Order"
Cohesion (entity basis within full-graph community): 1
Nodes (2): Order, TrackedOrder

### Community 37 - "App Order Tracker — Bell"
Cohesion (entity basis within full-graph community): 1
Nodes (2): OrderTracker\(\), pressDelayBell\(\)

### Community 38 - "Proxy"
Cohesion (entity basis within full-graph community): 1
Nodes (1): proxy\(\)

### Community 39 - "App Restaurant App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): RestaurantAppProps

### Community 40 - "App Restaurant App — App"
Cohesion (entity basis within full-graph community): 1
Nodes (2): RestaurantApp\(\), handleSessionReady\(\)

### Community 41 - "App Session — Session"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SessionScreenProps

### Community 42 - "App Session — Check"
Cohesion (entity basis within full-graph community): 1
Nodes (2): checkExistingSession\(\), handleNameSubmit\(\)

### Community 43 - "App Super Admin Panel — Admin"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SuperAdminPanelProps

### Community 44 - "File SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 45 - "Globe SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 46 - "Index TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 47 - "Next Env D TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 48 - "Vercel SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 49 - "Window SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **101 weakly connected node(s):** `Props`, `StatusIcon\(\)`, `handleLogout\(\)`, `QRGeneratorProps`, `TableQR` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `App`** (2 nodes): `loading /\[restaurant\_slug\]`, `/\[restaurant\_slug\]`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App — Login`** (2 nodes): `page /novanode/login`, `/novanode/login`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Loading`** (2 nodes): `loading.tsx`, `Loading\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Menu Manager — Manager`** (2 nodes): `MenuManager.tsx`, `MenuManagerProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Public Next`** (2 nodes): `next.svg`, `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Order Tracker — Order`** (2 nodes): `Order`, `TrackedOrder`
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

- **Why does \`MenuManager\(\)\` connect \`App Menu Manager\` to \`App Menu Manager — Manager\`, \`App Menu Manager — Item\`, \`App Login Form\`?**
  _High betweenness centrality \(1248.500\) - this node is a cross-community bridge._
- **Why does \`layout /\` connect \`App Layout\` to \`App Page — Menu\`, \`App Page\`, \`App Page — Kds\`, \`App Page — Home\`, \`App Page — Login\`, \`App\`, \`App — Login\`, \`App Page — Admin\`, \`App Page — Suspended\`?**
  _High betweenness centrality \(1146.000\) - this node is a cross-community bridge._
- **Why does \`KDSBoard\(\)\` connect \`App Kds Board — Order\` to \`App Kds Board\`, \`App Login Form\`?**
  _High betweenness centrality \(908.500\) - this node is a cross-community bridge._
- **What connects \`Props\`, \`StatusIcon\(\)\`, \`handleLogout\(\)\` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
