import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeName } from "@/utils/categoryNormalize";
import { categoryKey } from "@/utils/categoryNormalize";
import type { Transaction } from "@/types/transaction";

export type CategoryType = "Income" | "Expense" | "Savings";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  emoji: string | null;
  created_at: string;
}

export function categoryDisplay(c: Pick<Category, "name" | "emoji">): string {
  return c.emoji ? `${c.emoji} ${c.name}` : c.name;
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as Category[];
}

function stripLeadingEmoji(raw: string): string {
  return raw.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/gu, "").trim();
}

export function useCategories(type?: CategoryType) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("categories-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          qc.invalidateQueries({ queryKey: ["categories"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const all = query.data ?? [];
  const categories = type ? all.filter((c) => c.type === type) : all;

  const addMutation = useMutation({
    mutationFn: async ({
      name,
      type,
    }: {
      name: string;
      type: CategoryType;
    }): Promise<Category> => {
      const clean = normalizeName(stripLeadingEmoji(name));
      if (!clean) throw new Error("Category name is required");

      const existing = (qc.getQueryData<Category[]>(["categories"]) ?? []).find(
        (c) =>
          c.type === type && c.name.toLowerCase() === clean.toLowerCase(),
      );
      if (existing) return existing;

      const { data, error } = await supabase
        .from("categories")
        .insert({ name: clean, type })
        .select()
        .single();

      if (error) {
        if ((error as any).code === "23505") {
          await qc.invalidateQueries({ queryKey: ["categories"] });
          const fresh = await fetchCategories();
          const found = fresh.find(
            (c) =>
              c.type === type &&
              c.name.toLowerCase() === clean.toLowerCase(),
          );
          if (found) return found;
        }
        throw error;
      }
      return data as Category;
    },
    onMutate: async ({ name, type }) => {
      const clean = normalizeName(stripLeadingEmoji(name));
      await qc.cancelQueries({ queryKey: ["categories"] });

      const previous = qc.getQueryData<Category[]>(["categories"]) ?? [];
      const exists = previous.some(
        (c) => c.type === type && c.name.toLowerCase() === clean.toLowerCase(),
      );

      if (!exists && clean) {
        qc.setQueryData<Category[]>(["categories"], [
          ...previous,
          {
            id: `temp-${type}-${clean.toLowerCase()}`,
            name: clean,
            type,
            emoji: null,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["categories"], context.previous);
      }
    },
    onSuccess: (created) => {
      qc.setQueryData<Category[]>(["categories"], (current = []) => {
        const withoutTemp = current.filter(
          (c) => !(c.id.startsWith("temp-") && c.type === created.type && c.name.toLowerCase() === created.name.toLowerCase()),
        );
        const exists = withoutTemp.some((c) => c.id === created.id);
        const next = exists ? withoutTemp : [...withoutTemp, created];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({
      category,
      newName,
    }: {
      category: Category;
      newName: string;
    }): Promise<Category> => {
      const clean = normalizeName(stripLeadingEmoji(newName));
      if (!clean) throw new Error("Category name is required");

      const all = qc.getQueryData<Category[]>(["categories"]) ?? [];
      const dup = all.find(
        (c) =>
          c.id !== category.id &&
          c.type === category.type &&
          c.name.toLowerCase() === clean.toLowerCase(),
      );
      if (dup) throw new Error("A category with this name already exists");

      if (clean === category.name) return category;

      const oldDisplay = categoryDisplay(category);
      const newDisplay = category.emoji ? `${category.emoji} ${clean}` : clean;

      const { data, error } = await supabase
        .from("categories")
        .update({ name: clean })
        .eq("id", category.id)
        .select()
        .single();
      if (error) throw error;

      // Cascade rename in transactions (exact match on stored display)
      if (oldDisplay !== newDisplay) {
        const { error: tErr } = await supabase
          .from("transactions")
          .update({ category: newDisplay })
          .eq("category", oldDisplay);
        if (tErr) throw tErr;
      }

      return data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      category,
      mode,
      targetDisplay,
    }: {
      category: Category;
      mode: "empty" | "reassign" | "uncategorized";
      targetDisplay?: string;
    }): Promise<void> => {
      const oldDisplay = categoryDisplay(category);

      if (mode === "reassign") {
        if (!targetDisplay) throw new Error("Pick a target category");
        const { error: tErr } = await supabase
          .from("transactions")
          .update({ category: targetDisplay })
          .eq("category", oldDisplay);
        if (tErr) throw tErr;
      } else if (mode === "uncategorized") {
        // Ensure an "Uncategorized" category row exists for this type
        const all = qc.getQueryData<Category[]>(["categories"]) ?? [];
        const existing = all.find(
          (c) =>
            c.type === category.type &&
            c.name.toLowerCase() === "uncategorized",
        );
        if (!existing) {
          const { error: insErr } = await supabase
            .from("categories")
            .insert({ name: "Uncategorized", type: category.type });
          if (insErr && (insErr as any).code !== "23505") throw insErr;
        }
        const { error: tErr } = await supabase
          .from("transactions")
          .update({ category: "Uncategorized" })
          .eq("category", oldDisplay);
        if (tErr) throw tErr;
      }

      const { error: delErr } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    categories,
    allCategories: all,
    isLoading: query.isLoading,
    addCategory: (name: string, type: CategoryType) =>
      addMutation.mutateAsync({ name, type }),
    isAdding: addMutation.isPending,
    renameCategory: (category: Category, newName: string) =>
      renameMutation.mutateAsync({ category, newName }),
    isRenaming: renameMutation.isPending,
    deleteCategory: (
      category: Category,
      mode: "empty" | "reassign" | "uncategorized",
      targetDisplay?: string,
    ) => deleteMutation.mutateAsync({ category, mode, targetDisplay }),
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Compute usage counts per category id from a transactions array.
 * Matches by canonical (emoji-stripped, lowercased) category key + type.
 */
export function useCategoryUsageCounts(
  cats: Category[],
  transactions: Transaction[],
): Record<string, number> {
  return useMemo(() => {
    const out: Record<string, number> = {};
    if (!cats.length) return out;

    // Pre-bucket transactions by type + canonical key
    const txMap = new Map<string, number>();
    for (const t of transactions) {
      const tType = t.transaction_type;
      if (!tType) continue;
      const k = `${tType}::${categoryKey(t.category)}`;
      txMap.set(k, (txMap.get(k) || 0) + 1);
    }

    for (const c of cats) {
      const k = `${c.type}::${categoryKey(categoryDisplay(c))}`;
      out[c.id] = txMap.get(k) || 0;
    }
    return out;
  }, [cats, transactions]);
}
