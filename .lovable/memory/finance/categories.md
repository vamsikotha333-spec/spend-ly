---
name: Category architecture
description: Per-user categories with budget_tracking + is_default flags; default templates seeded per-user on signup
type: feature
---
Categories are stored **per-user** in `public.categories` (RLS: own-only). Defaults live in `public.category_templates` and are copied into each user's `categories` on signup via the `handle_new_user_seed_categories` trigger.

Columns of note:
- `is_default boolean` — true for rows seeded from `category_templates`. Used purely for UI grouping ("🌍 Default" vs "👤 My Categories"). Defaults can still be renamed/deleted by their owner.
- `budget_tracking boolean` (default true) — when false, the category is hidden from Budget vs Actual pickers and sections. Toggleable per-row from the Manage Categories page.

Budget vs Actual splits into two sections based on category `type`:
- **Expense Budgets** — Expense categories with `budget_tracking=true`. Computed from Expense transactions.
- **Savings Targets** — Savings categories with `budget_tracking=true`. Computed from Savings transactions. "Spent" relabeled to "Saved".

Section assignment for existing budgets is inferred at render time by looking up the budget's category name in the user's categories. The `budgets` table itself has no type column.
