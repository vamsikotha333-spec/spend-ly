# FinTracker → Premium AI Finance Assistant

A 6-phase rollout. Each phase is independently shippable, leaves the app fully working, and preserves auth, RLS, family sharing, budgets, categories, and transactions. I'll ship one phase per turn and wait for your approval before the next.

## Hybrid data strategy (applies across all phases)

Reuse existing tables wherever possible. New tables only when truly required:
- `assets` (Net Worth: cash, bank, investments, gold, other) + `liabilities`
- `investments` (stocks, MF, gold, FD, PPF, EPF — invested value, current value)
- `notifications` (smart alerts feed)
- Reuse existing `savings_goals` (already present)

Derived from existing transactions (no new tables):
- Merchant, payment mode, weekday/weekend, monthly trends, member spending, subscription detection, AI coach inputs, calendar heatmap, NL search results.

All new tables get RLS scoped to `auth.uid()`, explicit GRANTs, and `updated_at` triggers. No existing table altered.

---

## Phase 1 — Foundation & Welcome Dashboard
- New `Home` page redesign: greeting (time-aware) + user name + date + quick-add + notifications bell
- Financial Summary strip: income / expenses / savings / balance / savings rate / budget usage + monthly progress bar
- Recent Transactions timeline grouped by Today / Yesterday / This Week / This Month with category icons
- Loading skeletons, sticky header, dark-mode polish, mobile-first
- Reuses existing data only — no migration

## Phase 2 — Net Worth, Cash Flow Forecast, Health Score 2.0
- Migration: `assets` + `liabilities` tables (RLS, GRANTs, triggers)
- Net Worth card with trend sparkline (cash / bank / investments / gold / other − liabilities)
- Cash Flow Forecast: current balance + expected income (from recurring) + upcoming bills/EMIs + month-end projection
- Health Score upgraded to weighted 6-factor scoring (savings rate, budget usage, emergency fund, debt, investments, income stability) with personalized text recommendations
- Simple Assets/Liabilities management UI

## Phase 3 — AI Financial Coach + Natural Language Search
- Edge function `ai-coach` using Lovable AI (`google/gemini-3-flash-preview`) — sends transaction aggregates (not raw rows) and returns 3–5 personalized tips
- Replaces static insights on Home + Insights page
- Heuristic-based NL search bar: parses queries like "food expenses last month", "amazon", "above 5000", "in June" into filters over existing transactions
- Subscription Tracker view: auto-detects recurring merchants from transactions + reads existing `recurring_transactions`; shows monthly cost, yearly cost, next due

## Phase 4 — Analytics Hub + Calendar View
Redesigned `/analytics` route with tabbed sections:
- Expense pie, Income vs Expense, Monthly trend, Weekly trend, Weekend vs Weekday, Category analysis, Member-wise, Payment mode (derived), Merchant analysis (derived), Budget performance, Monthly comparison
- Calendar heatmap: color intensity = daily spend, click date → transactions for that day
- Improved Budget Management: budget / actual / remaining / forecast / status chip (green/yellow/red)
- Enhanced Family Dashboard: per-member income/expense/savings/contribution %, combined savings, family net worth, goal progress

## Phase 5 — Investments + Smart Notifications + PDF Reports
- Migration: `investments` + `notifications` tables
- Investments page: stocks / MF / gold / FD / PPF / EPF — invested, current, P/L, allocation donut
- Notifications system: budget exceeded, salary received, large transaction, upcoming EMI, goal achieved, unusual spending — generated client-side from query data, persisted to `notifications`, shown in bell dropdown
- PDF export (jsPDF + html2canvas): monthly and yearly reports with charts + summary tables

## Phase 6 — Gamification + Dashboard Customization + Polish
- Streak/badge engine derived from transaction history (7-day streak, 30-day logger, Budget Master, Savings Champion, Goal Achieved) — stored as `notifications` rows of type "badge"; no extra table
- Dashboard customization: reorder, hide, resize widgets — layout saved to `localStorage` per user (no DB needed)
- Financial Insights summary page (ratios + averages + largest expense + top category/merchant)
- Performance pass: lazy-load heavy routes, paginate transactions page, memoize aggregates, animation polish

---

## Technical notes
- All new pages use existing shadcn/Tailwind tokens; no hardcoded colors
- AI coach is the only LLM call; NL search and notifications are deterministic to keep credits low
- Every phase ends in a working app; you can stop at any phase
- I will not modify existing tables, RLS, or auth flows

Reply **"Start Phase 1"** to begin, or tell me to adjust scope/order.