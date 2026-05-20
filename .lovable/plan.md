## Category Management: Edit, Delete, Usage Counts, Auto-Sync

Add a dedicated **Manage Categories** screen where users can see usage counts, rename, and safely delete categories. Existing dynamic add (from the Transaction form combobox) keeps working. All changes propagate automatically because every page already derives data from `transactions` via React Query / realtime.

### Where it lives

- New route: `/categories` → `src/pages/ManageCategories.tsx`
- New sidebar entry under **Finance**: "Categories" (Tag icon)
- Reuses existing `useCategories` hook (extended) and `useTransactions`

### UI: Manage Categories page

Three tabs: **Income | Expense | Savings** (matching the `type` segmentation).

Each tab shows a list of category rows:

```text
[emoji] Category Name                    (12 transactions)   [✏️] [🗑]
```

Behavior:
- Edit/Delete icons appear on row hover (always visible on touch)
- Empty state per tab: "No categories yet — add one from the transaction form"
- Smooth fade/slide on add/remove (framer-motion already present? if not, simple CSS transitions)
- Search box at top to filter long lists

### Usage count logic (dynamic, never stored)

For each category row, count is computed in-memory:

```ts
count = transactions.filter(t =>
  t.transaction_type === category.type &&
  categoryKey(t.category) === categoryKey(categoryDisplay(category))
).length
```

Uses existing `categoryKey` / `canonicalDisplay` from `src/utils/categoryNormalize.ts` so old transactions stored as `"🛒 Groceries"` match a new emoji-less `"Groceries"` row correctly.

### Edit (rename) flow

Inline edit: clicking ✏️ swaps the row's name into an Input + Save/Cancel buttons.

Validation:
- Trim + collapse spaces + Title Case via existing `normalizeName`
- Reject empty
- Reject duplicate within same `type` (case-insensitive) — show inline error "A category with this name already exists"

On Save:
1. `UPDATE categories SET name=$new WHERE id=$id`
2. **Cascade rename in transactions**: `UPDATE transactions SET category=$newDisplay WHERE category=$oldDisplay` — match by exact stored display string for the old category. Where `$newDisplay = emoji ? \`${emoji} ${newName}\` : newName`.
3. Invalidate `["categories"]` and `["transactions"]` queries; realtime channel already broadcasts transactions changes.

### Delete flow

On 🗑 click, look up `count` first.

**Case 1 — count === 0**: confirm via small popover "Delete this category?" → DELETE row → toast.

**Case 2 — count > 0**: open `AlertDialog` (using existing `alert-dialog` UI):

> "**Groceries** has **12 transactions**. What would you like to do?"

Three buttons:
1. **Cancel** — close
2. **Reassign to another category** — reveals a second `CategoryCombobox` (same `type`, excluding current). On confirm:
   - `UPDATE transactions SET category=$targetDisplay WHERE category=$oldDisplay`
   - `DELETE FROM categories WHERE id=$id`
3. **Delete anyway** — mark transactions as Uncategorized:
   - Ensure a category row `{ name: "Uncategorized", type: $type, emoji: null }` exists (insert if missing)
   - `UPDATE transactions SET category='Uncategorized' WHERE category=$oldDisplay`
   - `DELETE FROM categories WHERE id=$id`

All three cases invalidate React Query caches. Realtime + invalidation means **Monthly Summary, Category Analytics, Budget vs Actual, charts, filters** all refresh automatically — they already read from `useTransactions` + derive categories from transaction data.

### Auto-sync guarantee

No structural change needed to other pages. Verified data flow:
- `useTransactions` subscribes to `postgres_changes` on `public.transactions` → cascade UPDATE/DELETE statements above trigger real-time events for every connected client.
- `useCategories` invalidates on every mutation → combobox in `TransactionFormV2` shows fresh list immediately.
- Pages that derive category lists from transactions (Spending by Category, Budget, Monthly Summary) re-render on the same `transactions` update.

### Hook extensions: `useCategories`

Add to existing hook:
- `renameCategory({ id, newName })` — normalizes, duplicate-checks, updates row, cascades transactions
- `deleteCategory({ id, mode: 'empty' | 'reassign' | 'uncategorized', targetDisplay? })`
- `getUsageCount(category)` — pure helper that takes the transactions array (passed in by caller) and returns a number; or a `useCategoryUsageCounts(transactions)` selector returning `Record<categoryId, number>`.

The cascade UPDATEs use `supabase.from("transactions").update(...).eq("category", oldDisplay)`. Single statement, no per-row loop.

### Files

**Created**
- `src/pages/ManageCategories.tsx`
- `src/components/v2/Categories/CategoryRow.tsx` (single row with hover actions, inline edit)
- `src/components/v2/Categories/DeleteCategoryDialog.tsx` (the 3-option AlertDialog)

**Edited**
- `src/hooks/useCategories.ts` — add rename/delete mutations, usage-count selector
- `src/components/layout/AppSidebar.tsx` — add "Categories" nav item under Finance
- `src/App.tsx` — add `/categories` route

### Not in scope

- Editing emojis (rename keeps existing emoji; new categories created via combobox stay emoji-less as today)
- Per-user permissions (app is shared / no auth)
- Bulk delete / multi-select
