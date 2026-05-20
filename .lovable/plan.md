# Plan: Global Default Categories + Per-User Dynamic Members

Goal: New users get the full seeded category list automatically, hardcoded names (Vamsi/Yasoda/Abdul/Central/MDPL/…) disappear for everyone except the historical data that already references them, and every user manages their own member list that drives all dropdowns/filters/analytics. current user vamsikotha mail, he shiould have usual default names as he is using from long back. the same names

No UI redesign. No changes to historical rows. All existing analytics keep working because they read `added_by` / `applicable_to` strings straight from each user's own transactions.

---

## 1. Database changes (single new migration)

### a) `category_templates` (new table — the master list for new users)

```
id uuid pk, name text, type text, emoji text, sort_order int, created_at timestamptz
unique(type, lower(name))
```

- Seed it with the exact same Income/Expense/Savings rows currently in the original seed migration (the 28 expense + 5 income + 7 savings).
- RLS: `SELECT` allowed to `authenticated` (read-only reference data). No insert/update/delete from client.
- Does **not** replace `public.categories`. Existing categories rows (with their ids, names, user_id) remain untouched so every historical transaction/budget/goal mapping is preserved.

### b) `members` (new table — per-user dynamic member list)

```
id uuid pk default gen_random_uuid()
user_id uuid not null default auth.uid() references auth.users(id) on delete cascade
name text not null
created_at timestamptz default now()
unique(user_id, lower(name))
```

- RLS: standard `user_id = auth.uid()` for select/insert/update/delete (authenticated only).
- Add to `supabase_realtime` publication.
- **No seed data.** New users start with an empty list, exactly as requested.

### c) Signup trigger — copy templates into `public.categories` for the new user

```
create function public.handle_new_user_categories() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (name, type, emoji, user_id)
  select t.name, t.type, t.emoji, new.id
  from public.category_templates t
  on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created_seed_categories
after insert on auth.users
for each row execute function public.handle_new_user_categories();
```

- Fires once per signup (email or Google). Inserts rows owned by the new user_id, so the existing `categories` RLS (`user_id = auth.uid()`) keeps the user isolated.
- Existing users are not touched — their `categories` rows already exist.
- Idempotent via the existing `categories_type_name_unique` index — but note that index is global `(type, lower(name))`. We need to drop that index and replace with `(user_id, type, lower(name))` so two different users can each own a "Groceries" row. This is a safe change: current data has only one owner, so no duplicates exist.

### d) No changes to: `transactions`, `budgets`, `savings_goals`, `recurring_transactions` schemas or RLS. Historical `added_by` / `applicable_to` values stay as plain strings; old names like "Vamsi" continue to appear only inside that one user's existing data.

---

## 2. Frontend — remove hardcoded names

### `src/types/transaction.ts`

- Delete `ADDED_BY_OPTIONS` and `APPLICABLE_TO_OPTIONS` exports (or keep them as `[] as const` for any leftover import safety, then remove call sites).
- `CATEGORIES` constant stays for backward compatibility but is no longer used for dropdowns (already replaced by `CategoryCombobox` reading from DB).

### New hook `src/hooks/useMembers.ts`

- `useMembers()` → `{ members: string[], addMember, renameMember, deleteMember, isLoading }`.
- React Query against `members` table, realtime subscription, same patterns as `useCategories`.

### Replace all usages of the two constants:


| File                                               | Change                                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/v2/Transactions/TransactionFormV2.tsx` | Use `useMembers()` for both Added By and Applicable To select options. If list is empty, show a hint "Add members in Settings → Members" with a link. |
| `pages/Transactions.tsx` (filter)                  | Same — load from `useMembers()`.                                                                                                                      |
| `pages/SavingsGoals.tsx`                           | Same for the person select.                                                                                                                           |
| `pages/RecurringTransactions.tsx`                  | Same for both selects.                                                                                                                                |
| `components/v2/Dashboard/AdvancedFilter.tsx`       | Same for Added By & Applicable To groups.                                                                                                             |
| `components/v2/Analytics/MonthlySummaryV2.tsx`     | Iterate over `useMembers()` instead of `APPLICABLE_TO_OPTIONS`.                                                                                       |
| `components/v2/Dashboard/SpendingByPerson.tsx`     | Iterate over `useMembers()` instead.                                                                                                                  |


For analytics components that previously iterated a fixed list, also union with members actually present in the filtered transactions (so historical names still surface for that user even if not in their current members list — preserves analytics). Implementation: `Array.from(new Set([...members, ...txns.map(t => t.applicable_to).filter(Boolean)]))`.

---

## 3. Manage Members UI

### New page `src/pages/ManageMembers.tsx`

- Mirrors the visual structure of `ManageCategories.tsx` (reuse the same Card/Row layout — no redesign).
- Inline add, inline rename, delete with confirm dialog.
- On delete, do NOT touch historical transactions — they keep the old string. Show a small note: "Existing transactions keep this name; it just won't appear in new dropdowns."

### Route + sidebar entry

- Add `/members` route in `App.tsx` inside the protected layout.
- Add a "Members" item to `AppSidebar.tsx` next to "Categories".

---

## 4. Backward compatibility checks

- Existing user `969c5b5e-…` (current account) keeps all categories, transactions, budgets, goals, recurring rows. Sidebar gains a Members link; their Members table starts empty — they can add Vamsi/Yasoda/Abdul themselves, or we can offer a one-time "Import names from my transactions" button on the Manage Members page (auto-detect distinct `added_by` + `applicable_to` from their own transactions). I'll include that button so the original account isn't left with empty dropdowns.
- All charts and analytics keep working because they aggregate by the string stored on each transaction, not by the constants.
- RLS already isolates every table per `user_id` — multi-user isolation requirement is already satisfied; this plan does not weaken it.

---

## 5. Technical summary (for review)

- 1 migration: `category_templates` + seed, `members` + RLS + realtime, `handle_new_user_categories` trigger on `auth.users`, swap unique index on `categories` to `(user_id, type, lower(name))`.
- 1 new hook (`useMembers`), 1 new page (`ManageMembers`), 1 sidebar item, 1 route.
- ~8 component edits to swap `ADDED_BY_OPTIONS` / `APPLICABLE_TO_OPTIONS` for `useMembers()` + historical-union.
- Zero changes to `transactions`, `budgets`, `savings_goals`, `recurring_transactions` schemas, RLS, or any analytics math.

Ready to implement on approval.