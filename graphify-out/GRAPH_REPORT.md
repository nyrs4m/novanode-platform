# Graph Report - C:\\Users\\samue\\novanode-platform  (2026-07-08)

## Corpus Check
- Corpus is ~45,606 words - fits in a single context window. You may not need a graph.

## Summary
- 224 nodes · 273 edges · 62 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 186 non-file, non-concept node(s)
- Weakly connected components: 59
- Singleton components: 33
- Isolated nodes: 33
- Largest component: 24 node(s) (13% of the entity graph basis)
- Low-cohesion communities: 1
- Largest low-cohesion community: 14 node(s) (cohesion 0.14)

## Workspace Bridges
1. `MenuClient\(\)` - connects `App Menu Client — Add`, `App Menu Client — Cart`, `App Menu Client — Cart \(2\)`, `App Menu Client — Groups`, `App Menu Client — Modifier`; home: `App Menu Client`; degree 23; score 4210.5
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/components/MenuClient.tsx`
2. `DashboardHome\(\)` - connects `App Dashboard Home — Dashboard`, `App Dashboard Home — Promo`, `App Dashboard Home — Refresh`, `App Dashboard Home — Staff`; home: `App Dashboard Home`; degree 17; score 3418.17
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/dashboard/\[restaurant\_slug\]/components/DashboardHome.tsx`
3. `KDSBoard\(\)` - connects `App Kds Board — Close`, `App Time Ago`; home: `App Kds Board — Time`; degree 9; score 1675.17
  source files: `C:/Users/samue/novanode-platform/app/\(admin\)/kds/\[restaurant\_slug\]/components/KDSBoard.tsx`, `C:/Users/samue/novanode-platform/app/\(admin\)/kds/\[restaurant\_slug\]/components/TimeAgo.tsx`
4. `confirmModifierSelection\(\)` - connects `App Menu Client`, `App Menu Client — Add`; home: `App Menu Client — Modifier`; degree 5; score 27.83
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/components/MenuClient.tsx`
5. `addItem\(\)` - connects `App Menu Client`, `App Menu Client — Groups`; home: `App Menu Client — Add`; degree 4; score 25.33
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/components/MenuClient.tsx`
6. `fetchModifierGroups\(\)` - connects `App Menu Client`, `App Menu Client — Add`; home: `App Menu Client — Groups`; degree 3; score 23.5
  source files: `C:/Users/samue/novanode-platform/app/\(customer\)/\[restaurant\_slug\]/components/MenuClient.tsx`

## God Nodes
1. `MenuClient\(\)` - 25 edges
2. `DashboardHome\(\)` - 19 edges
3. `MenuManager\(\)` - 14 edges
4. `layout /` - 12 edges
5. `KDSBoard\(\)` - 11 edges
6. `POST\(\)` - 9 edges
7. `SuperAdminPanel\(\)` - 9 edges
8. `SessionScreen\(\)` - 8 edges
9. `getSupabase\(\)` - 7 edges
10. `QRGenerator\(\)` - 7 edges

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
- **[HIGH] Bridge node** - MenuClient\(\) bridges App Menu Client and App Menu Client — Cart, App Menu Client — Cart \(2\), App Menu Client — Add, App Menu Client — Groups, App Menu Client — Modifier, App Restaurant App.
  _High betweenness centrality \(4137.500\) across 7 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - DashboardHome\(\) bridges App Dashboard Home and App Dashboard Home — Dashboard, App Dashboard Home — Refresh, App Dashboard Home — Promo, App Dashboard Home — Staff, App Login Form.
  _High betweenness centrality \(3361.167\) across 6 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - layout / bridges App Layout and App Page — Menu, App Page, App Page — Kds, App Page — Home, App Page — Login, App, App Page — Suspended, App — Login, App Page — Admin.
  _High betweenness centrality \(1464.000\) across 10 communities makes this node a likely dependency chokepoint._
- **[HIGH] Cross-boundary edge** - loading /\[restaurant\_slug\] → Loading\(\) crosses graph boundaries in an unexpected way.
  _connects across different repos/directories; bridges separate communities_
- **[HIGH] Cross-boundary edge** - page /novanode/login → NovaNodeLoginPage\(\) crosses graph boundaries in an unexpected way.
  _connects across different repos/directories; bridges separate communities_

## Communities

### Community 0 - "App Menu Client"
Cohesion (entity basis within full-graph community): 0.15
Nodes (13): MenuClient\(\), fetchPromos\(\), fetchStaff\(\), handleChange\(\), handleScroll\(\), placeOrder\(\), removeItem\(\), sendSignal\(\) (+5 more)

### Community 1 - "App Menu Manager"
Cohesion (entity basis within full-graph community): 0.33
Nodes (11): MenuManager\(\), deleteCategory\(\), deleteItem\(\), getSupabase\(\), handleAutoTranslate\(\), handleImageUpload\(\), openAddItem\(\), resetForm\(\) (+3 more)

### Community 2 - "App Route"
Cohesion (entity basis within full-graph community): 0.22
Nodes (9): POST /api/admin/create-staff, POST /api/admin/onboard-restaurant, POST /api/admin/save-modifier-group, POST /api/admin/save-modifier-option, POST /api/admin/update-restaurant, POST /api/paystack/initialize, POST /api/paystack/webhook, POST /api/revalidate (+1 more)

### Community 3 - "App Dashboard Home"
Cohesion (entity basis within full-graph community): 0.25
Nodes (8): DashboardHome\(\), checkClosingTime\(\), fetchAnalytics\(\), handleBannerUpload\(\), handleLogoUpload\(\), handleLogout\(\), saveProfile\(\), saveTheme\(\)

### Community 4 - "App Kds Board"
Cohesion (entity basis within full-graph community): 0
Nodes (7): isOrderCardItem\(\), KDSBoardProps, OrderCardItem, OrderItemModifier, Signal, signalIcon\(\), signalLabel\(\)

### Community 5 - "App Menu Client — Cart"
Cohesion (entity basis within full-graph community): 0
Nodes (7): BillSplitter\(\), CartItem, CartModifier, MenuClientProps, OrderItemSnapshot, SessionOrder, StaffMember

### Community 6 - "App Super Admin Panel"
Cohesion (entity basis within full-graph community): 0.25
Nodes (8): SuperAdminPanel\(\), clearOverdue\(\), handleLogout\(\), onboardRestaurant\(\), refreshCounts\(\), refreshTodayLedger\(\), toggleSuspend\(\), updateSessionFee\(\)

### Community 7 - "App Kds Board — Time"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): KDSBoard\(\), checkClosingTime\(\), resolveSignal\(\), toggleStock\(\), updateOrderStatus\(\), updateOrderStatusWithTime\(\), TimeEstimatePicker\(\)

### Community 8 - "App Login Form"
Cohesion (entity basis within full-graph community): 0.3
Nodes (5): LoginForm\(\), handleLogin\(\), handleOtpVerify\(\), handleResendCode\(\), PageProps

### Community 9 - "App Qr Generator"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): QRGenerator\(\), copyUrl\(\), downloadAll\(\), downloadQR\(\), printAll\(\), saveQRsToDatabase\(\)

### Community 10 - "App Layout"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): layout /, AdminLayout\(\), CustomerLayout\(\), RootLayout\(\)

### Community 11 - "App Dashboard Home — Dashboard"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): Props, StatusIcon\(\), StatusLabel\(\), StatsDashboard\(\)

### Community 12 - "App Receipt Modal"
Cohesion (entity basis within full-graph community): 0
Nodes (4): OrderItem, ReceiptModalProps, ReceiptOrder, StaffMember

### Community 13 - "App Page"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): DashboardHome\(\), page /dashboard/\[restaurant\_slug\], DashboardPage\(\)

### Community 14 - "App Page — Menu"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): MenuManager\(\), page /dashboard/\[restaurant\_slug\]/menu, MenuPage\(\)

### Community 15 - "App Page — Kds"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): KDSBoard\(\), page /kds/\[restaurant\_slug\], KDSPage\(\)

### Community 16 - "App Page — Login"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): LoginForm\(\), page /login, LoginPage\(\)

### Community 17 - "App Page — Admin"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): SuperAdminPanel\(\), page /novanode, NovaNodeAdminPage\(\)

### Community 18 - "App Route — Delete"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): DELETE /api/admin/delete-modifier-group, DELETE /api/admin/delete-modifier-option, DELETE\(\)

### Community 19 - "App Dashboard Home — Staff"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): addStaff\(\), deleteStaff\(\), fetchStaff\(\), updateStaffName\(\)

### Community 20 - "App Receipt Modal — Receipt"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): ReceiptModal\(\), downloadPDF\(\), shareReceipt\(\), submitFeedback\(\)

### Community 21 - "App Session"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): SessionScreen\(\), adjustStarter\(\), handleStartersSubmit\(\), t\(\)

### Community 22 - "App Stats Dashboard"
Cohesion (entity basis within full-graph community): 0
Nodes (3): StatsProps, StatusIcon\(\), StatusLabel\(\)

### Community 23 - "App Time Ago"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): TimeAgo\(\), TimeAgoDisplay\(\), update\(\)

### Community 24 - "App Page — Restaurant"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): RestaurantApp\(\), page /\[restaurant\_slug\], RestaurantMenuPage\(\)

### Community 25 - "App Page — Home"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /, Home\(\)

### Community 26 - "App Page — Suspended"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /\[restaurant\_slug\]/suspended, SuspendedPage\(\)

### Community 27 - "App Route — API"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): GET /api/analytics, GET /api/paystack/callback, GET\(\)

### Community 28 - "App Dashboard Home — Promo"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): deletePromo\(\), fetchPromos\(\), savePromo\(\)

### Community 29 - "App Menu Client — Add"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): addConfiguredItem\(\), addItem\(\), closeModifierSheet\(\)

### Community 30 - "App Menu Client — Modifier"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): confirmModifierSelection\(\), modifierSelectionComplete\(\), selectedCartModifiers\(\)

### Community 31 - "App Order Tracker"
Cohesion (entity basis within full-graph community): 0
Nodes (2): formatCountdown\(\), OrderTrackerProps

### Community 32 - "App Page — Login \(2\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): NovaNodeLoginInner\(\), handleLogin\(\), NovaNodeLoginPage\(\)

### Community 33 - "App Qr Generator — Qr"
Cohesion (entity basis within full-graph community): 0
Nodes (2): QRGeneratorProps, TableQR

### Community 34 - "App Session — Check"
Cohesion (entity basis within full-graph community): 1
Nodes (3): checkExistingSession\(\), handleNameSubmit\(\), validateUrlToken\(\)

### Community 35 - "Components Spotlight Layout"
Cohesion (entity basis within full-graph community): 0
Nodes (2): SpotlightLayout\(\), SpotlightLayoutProps

### Community 36 - "App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): loading /\[restaurant\_slug\]

### Community 37 - "App — Login"
Cohesion (entity basis within full-graph community): 1
Nodes (1): page /novanode/login

### Community 38 - "App Dashboard Home — Refresh"
Cohesion (entity basis within full-graph community): 1
Nodes (2): refreshCounts\(\), refreshTodayRevenue\(\)

### Community 39 - "App Kds Board — Close"
Cohesion (entity basis within full-graph community): 1
Nodes (2): closeTable\(\), fetchLedger\(\)

### Community 40 - "App Loading"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Loading\(\)

### Community 41 - "App Menu Client — Groups"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchModifierGroups\(\), normalizeModifierGroups\(\)

### Community 42 - "App Menu Client — Cart \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): isSameCartLine\(\), modifierSignature\(\)

### Community 43 - "App Menu Manager — Manager"
Cohesion (entity basis within full-graph community): 1
Nodes (1): MenuManagerProps

### Community 44 - "App Menu Manager — Edit"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchModifierGroups\(\), openEditItem\(\)

### Community 45 - "Public Next"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 46 - "App Order Tracker — Omit"
Cohesion (entity basis within full-graph community): 1
Nodes (2): Omit, TrackedOrder

### Community 47 - "App Order Tracker — Bell"
Cohesion (entity basis within full-graph community): 1
Nodes (2): OrderTracker\(\), pressDelayBell\(\)

### Community 48 - "Proxy"
Cohesion (entity basis within full-graph community): 1
Nodes (1): proxy\(\)

### Community 49 - "App Receipt Modal — Item"
Cohesion (entity basis within full-graph community): 1
Nodes (2): itemLineTotal\(\), itemModifierTotal\(\)

### Community 50 - "App Restaurant App"
Cohesion (entity basis within full-graph community): 1
Nodes (1): RestaurantAppProps

### Community 51 - "App Restaurant App — App"
Cohesion (entity basis within full-graph community): 1
Nodes (2): RestaurantApp\(\), handleSessionReady\(\)

### Community 52 - "App Session — Session"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SessionScreenProps

### Community 53 - "App Super Admin Panel — Admin"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SuperAdminPanelProps

### Community 54 - "Database Types TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 55 - "File SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 56 - "Globe SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 57 - "Index TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 58 - "Next Env D TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 59 - "Novalogo Png"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 60 - "Vercel SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 61 - "Window SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **124 weakly connected node(s):** `Props`, `StatusIcon\(\)`, `checkClosingTime\(\)`, `fetchAnalytics\(\)`, `handleLogout\(\)` (+119 more)
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
- **Thin community `App Menu Client — Groups`** (2 nodes): `fetchModifierGroups\(\)`, `normalizeModifierGroups\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Menu Client — Cart \(2\)`** (2 nodes): `isSameCartLine\(\)`, `modifierSignature\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Menu Manager — Manager`** (2 nodes): `MenuManager.tsx`, `MenuManagerProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Menu Manager — Edit`** (2 nodes): `fetchModifierGroups\(\)`, `openEditItem\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Public Next`** (2 nodes): `next.svg`, `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Order Tracker — Omit`** (2 nodes): `Omit`, `TrackedOrder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Order Tracker — Bell`** (2 nodes): `OrderTracker\(\)`, `pressDelayBell\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Proxy`** (2 nodes): `proxy.ts`, `proxy\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Receipt Modal — Item`** (2 nodes): `itemLineTotal\(\)`, `itemModifierTotal\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Restaurant App`** (2 nodes): `RestaurantApp.tsx`, `RestaurantAppProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Restaurant App — App`** (2 nodes): `RestaurantApp\(\)`, `handleSessionReady\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Session — Session`** (2 nodes): `session.tsx`, `SessionScreenProps`
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
- **Thin community `Novalogo Png`** (1 nodes): `novalogo.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel SVG`** (1 nodes): `vercel.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Window SVG`** (1 nodes): `window.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does \`MenuClient\(\)\` connect \`App Menu Client\` to \`App Menu Client — Cart\`, \`App Menu Client — Cart \(2\)\`, \`App Menu Client — Add\`, \`App Menu Client — Groups\`, \`App Menu Client — Modifier\`, \`App Restaurant App\`?**
  _High betweenness centrality \(4137.500\) - this node is a cross-community bridge._
- **Why does \`DashboardHome\(\)\` connect \`App Dashboard Home\` to \`App Dashboard Home — Dashboard\`, \`App Dashboard Home — Refresh\`, \`App Dashboard Home — Promo\`, \`App Dashboard Home — Staff\`, \`App Login Form\`?**
  _High betweenness centrality \(3361.167\) - this node is a cross-community bridge._
- **Why does \`MenuManager\(\)\` connect \`App Menu Manager\` to \`App Menu Manager — Manager\`, \`App Menu Manager — Edit\`, \`App Login Form\`?**
  _High betweenness centrality \(2268.500\) - this node is a cross-community bridge._
- **What connects \`Props\`, \`StatusIcon\(\)\`, \`checkClosingTime\(\)\` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should \`App Menu Client\` be split into smaller, more focused modules?**
  _Cohesion score 0.14 across 14 entity nodes - this community may mix unrelated responsibilities._
