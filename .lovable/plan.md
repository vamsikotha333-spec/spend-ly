## Goal
Upgrade Categories + Budget vs Actual to a professional multi-user model: shared system defaults, private user categories, per-category budget tracking opt-in, and separate Expense Budgets vs Savings Targets.

## Current state
- `categories` table is per-user (has `user_id`), seeded on signup from `category_templates` via trigger. So every user already has their own copy of the defaults.
- `budgets` table is per-user, currently expense-only in UI (`useCategories("Expense")`).
- `BudgetVsActual` page only shows Expense categories and pulls all of them — no opt-in.

## Plan

### 1. Database migration
- Add `categories.budget_tracking boolean NOT NULL DEFAULT true` so existing categories continue to appear in Budget vs Actual (backward compatible).
- Add `categories.is_default boolean NOT NULL DEFAULT false`. Backfill `true` for any row whose `(name,type)` matches a row in `category_templates` — this gives the "Default vs My Categories" grouping without changing the per-user copy model (keeps RLS + existing transactions intact).
- Update `handle_new_user_seed_categories` to set `is_default = true` on seeded rows.
- No change to `budgets` table — still `(category, person, month, user_id)`.
- No data migration of transactions (categories remain user-scoped, so isolation already holds).

### 2. Hook changes (`useCategories.ts`)
- Extend `Category` type with `budget_tracking: boolean` and `is_default: boolean`.
- `addCategory(name, type, budgetTracking=true)` — pass new field.
- New `updateCategory({ id, name?, type?, budget_tracking? })` — replaces the name-only `renameCategory` (keep `renameCategory` as a thin wrapper for back-compat with `CategoryRow`).
- When `type` changes, cascade in `transactions.transaction_type` is NOT done (transaction_type is the type at entry time; leave history intact). Document this.
- `useBudgetedCategories(type?)` helper that returns `categories.filter(c => c.budget_tracking)`.

### 3. Categories page (`ManageCategories.tsx`)
- Within each type tab, split list into two sections with headers:
  - 🌍 Default Categories (`is_default = true`)
  - 👤 My Categories (`is_default = false`)
- Update `CategoryRow` to show a Budget Tracking toggle (Switch) and a type-change menu in the edit dialog.
- Update `CategoryCombobox` quick-add to default `budget_tracking = true`; expose a richer "Add category" dialog with Name / Type / Budget Tracking switch (used from Categories page, not the inline combobox).

### 4. Budget vs Actual page
- Replace single section with two stacked sections inside the existing layout:
  - **Expense Budgets** (red/orange accent) — uses Expense categories with `budget_tracking = true`.
  - **Savings Targets** (green/blue accent) — uses Savings categories with `budget_tracking = true`. "Spent" relabeled to "Saved", computed from Savings transactions.
- Top filter: `All | Expense | Savings` controlling which sections render.
- Add-budget dialog gets a Type selector (Expense/Savings) that filters the category dropdown to budget-tracked categories of that type.
- All existing budgets continue to work (they're keyed by category name; we infer section by looking up the category's type).

### 5. Sync
Already handled — every consumer uses `useCategories()` which subscribes to realtime postgres_changes on `categories`. New `budget_tracking` / `is_default` fields flow through the same channel.

## Technical details
- Migration adds two columns + backfill + trigger update. No GRANT changes needed (existing grants cover new columns).
- `CategoryRow` gains an inline `<Switch>` bound to `budget_tracking`; toggling calls `updateCategory({ id, budget_tracking })` optimistically.
- `BudgetVsActual` keeps `useBudgets`/`addBudget` API unchanged; selection of category list is the only behavioural change.
- "Savings Targets" reuses `BudgetCategoryCard` with a `variant="savings"` prop driving color tokens (`bg-success/10`, `text-success`) vs default expense styling.

## Out of scope (explicit)
- Not converting `is_default` rows to a single shared table — current per-user copy already works and avoids a destructive migration that would risk historical data. Grouping in the UI achieves the same UX.
- Not changing Savings Goals — those remain separate from category-level Savings Targets.
