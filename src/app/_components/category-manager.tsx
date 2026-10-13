"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type Category,
  type CategoryDraft,
  type CategoryType,
  categoryDraftSchema,
} from "@/lib/categories";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "@/services/categories";
import { listRecords } from "@/services/records";

const categoryTypeNames: Record<CategoryType, string> = {
  income: "收入類別",
  expense: "支出類別",
};

export default function CategoryManager() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<CategoryType>("income");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const form = useForm<CategoryDraft>({
    defaultValues: { type: "income", name: "" },
    resolver: zodResolver(categoryDraftSchema),
  });
  const categoriesQuery = useQuery({
    enabled: typeof window !== "undefined",
    queryFn: () => listCategories(selectedType),
    queryKey: ["categories", selectedType],
  });
  const recordsQuery = useQuery({
    enabled: typeof window !== "undefined",
    queryFn: listRecords,
    queryKey: ["records"],
  });
  const saveMutation = useMutation({
    mutationFn: async (draft: CategoryDraft) =>
      editingCategory
        ? renameCategory(editingCategory.id, draft.name)
        : createCategory(draft),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["records"] }),
      ]);
      setEditingCategory(null);
      form.reset({ type: selectedType, name: "" });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (category: Category) => deleteCategory(category.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeletingCategory(null);
    },
  });
  const categories = categoriesQuery.data ?? [];
  const records = recordsQuery.data ?? [];

  const chooseType = (type: CategoryType) => {
    setSelectedType(type);
    setEditingCategory(null);
    form.reset({ type, name: "" });
  };

  const beginRename = (category: Category) => {
    setEditingCategory(category);
    form.reset({ type: category.type, name: category.name });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    form.reset({ type: selectedType, name: "" });
  };

  const submit = form.handleSubmit((draft) => saveMutation.mutate(draft));

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Tag aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            管理收支類別
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            收入與支出分開分類。重新命名會同步更新既有收支紀錄。
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Button
          aria-pressed={selectedType === "income"}
          className={
            selectedType === "income"
              ? "bg-emerald-800 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }
          onClick={() => chooseType("income")}
          type="button"
        >
          收入類別
        </Button>
        <Button
          aria-pressed={selectedType === "expense"}
          className={
            selectedType === "expense"
              ? "bg-emerald-800 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }
          onClick={() => chooseType("expense")}
          type="button"
        >
          支出類別
        </Button>
      </div>

      <form className="rounded-2xl bg-slate-50 p-4" onSubmit={submit}>
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="category-name">
                  {editingCategory
                    ? `重新命名${categoryTypeNames[selectedType]}`
                    : `新增${categoryTypeNames[selectedType]}`}
                </FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  id="category-name"
                  placeholder={
                    selectedType === "income" ? "例如：稿費" : "例如：寵物"
                  }
                  {...field}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />
          {saveMutation.isError && (
            <p className="text-sm font-medium text-rose-600" role="alert">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "儲存失敗，請稍後再試。"}
            </p>
          )}
          <div className="flex gap-2">
            <Button disabled={saveMutation.isPending} type="submit">
              {editingCategory ? (
                <Pencil aria-hidden="true" className="size-4" />
              ) : (
                <Plus aria-hidden="true" className="size-4" />
              )}
              {editingCategory ? "儲存名稱" : "新增類別"}
            </Button>
            {editingCategory && (
              <Button onClick={cancelEditing} type="button" variant="outline">
                <X aria-hidden="true" className="size-4" />
                取消
              </Button>
            )}
          </div>
        </FieldGroup>
      </form>

      <div className="mt-5">
        {categoriesQuery.isPending ? (
          <p className="py-6 text-center text-sm text-slate-500">
            正在載入類別…
          </p>
        ) : categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm leading-6 text-slate-500">
            目前沒有{categoryTypeNames[selectedType]}
            ，請新增一個類別以繼續記帳。
          </p>
        ) : (
          <ul
            aria-label={categoryTypeNames[selectedType]}
            className="divide-y divide-slate-100"
          >
            {categories.map((category) => {
              const usageCount = records.filter(
                (record) =>
                  record.type === category.type &&
                  record.category === category.name,
              ).length;

              return (
                <li
                  className="flex items-center justify-between gap-3 py-3"
                  key={category.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">
                      {category.name}
                    </p>
                    {usageCount > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {usageCount} 筆紀錄使用中，請先重新分配紀錄
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      aria-label={`重新命名${category.name}`}
                      onClick={() => beginRename(category)}
                      size="sm"
                      variant="ghost"
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      編輯
                    </Button>
                    <Button
                      aria-label={`刪除${category.name}`}
                      disabled={usageCount > 0}
                      onClick={() => setDeletingCategory(category)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      刪除
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialogRoot
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        open={Boolean(deletingCategory)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>刪除收支類別</AlertDialogTitle>
          <AlertDialogDescription>
            確定要刪除「{deletingCategory?.name}
            」類別嗎？此類別必須沒有正在使用的收支紀錄。
          </AlertDialogDescription>
          {deleteMutation.isError && (
            <p className="mt-3 text-sm font-medium text-rose-600" role="alert">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "刪除失敗，請稍後再試。"}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              onClick={() => setDeletingCategory(null)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingCategory) deleteMutation.mutate(deletingCategory);
              }}
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              確認刪除
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialogRoot>
    </section>
  );
}
