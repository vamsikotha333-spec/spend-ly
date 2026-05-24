## Goal
Transform AI Insights, Net Cashflow, and Category Analytics into a fully intelligent, dynamic, user-specific financial analysis system.

## Scope of changes

### 1. AI Insights (`supabase/functions/ai-insights/index.ts` + `AIInsights.tsx`)
- Expand edge function input to include: per-member spend/savings, goals, recurring transactions, multi-month trend series, savings rate trends, top categories with MoM deltas, weekend vs weekday spend, recurring expense detection.
- Rewrite system prompt to produce richer, multi-section structured JSON:
  - `healthScore`, `healthSummary`
  - `positiveTrends[]` (good habits — green cards)
  - `warnings[]` (bad habits / overspending — red cards)
  - `recommendations[]` (actionable, with rupee impact + yearly projection)
  - `categoryTrends[]` (top movers up/down)
  - `memberInsights[]` (comparison statements derived from data)
  - `goalInsights[]` (when goals exist)
  - `monthlyVerdict`
- Update `AIInsights.tsx` to render the new sections as compact cards/grids, preserving current visual style (tone colors, icons).

### 2. Member Comparison Panel (new component in Insights page)
- `MemberComparisonPanel.tsx`: computed entirely client-side from filtered transactions + savings_contributions.
  - Expense % per member (uses `applicable_to`, falls back to `added_by`)
  - Savings % per member
  - Essential vs non-essential split
  - Visual: progress bars + compact percentage cards
- Mount in `Insights.tsx` above `AIInsights`.

### 3. Category Analytics tabs (Expense / Savings / Income)
- `SpendingCategoryTable.tsx`: add a `transactionType` tab control (Expense | Savings | Income) using existing `Tabs` component.
- Filter computations by selected `transaction_type` (fallback to `type` mapping for legacy rows).
- Update header labels dynamically ("Spending"→"Savings"/"Income").
- Update `SpendingByCategory.tsx` page heading accordingly.

### 4. Net Cashflow percentage fix
- Find the Net Cashflow component (likely `MonthlySnapshot.tsx` / `StatsCards.tsx` / `CompactSummaryBar.tsx`) — inspect first.
- Replace any "Income %" with raw income amount.
- Expense % = expenses / income × 100; Savings % = savings / income × 100; Remaining = income − expenses − savings.
- Keep existing visual design, only fix math + labels.

## Constraints
- No DB schema changes — all data already user-scoped via RLS.
- Preserve existing UI/layout; only swap content and add sections within current containers.
- Fully responsive (grid `md:grid-cols-2/3`).
- No hardcoded member names — pull dynamic from transactions/`useMembers`.

## Files touched
- `supabase/functions/ai-insights/index.ts` (rewrite prompt + payload contract)
- `src/components/v2/Analytics/AIInsights.tsx` (richer rendering)
- `src/components/v2/Insights/MemberComparisonPanel.tsx` (new)
- `src/pages/Insights.tsx` (mount panel)
- `src/components/v2/Analytics/SpendingCategoryTable.tsx` (type tabs)
- `src/pages/SpendingByCategory.tsx` (heading)
- Net Cashflow component (TBD after inspection)
