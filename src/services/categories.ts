import {
  type Category,
  type CategoryDraft,
  type CategoryType,
  categoryDraftSchema,
  categorySchema,
  categoryTypeSchema,
} from "@/lib/categories";
import { readCategories, writeCategories } from "@/services/category-store";
import { listRecords, renameRecordCategory } from "@/services/records";

function normalizeName(name: string): string {
  return categoryDraftSchema.shape.name.parse(name);
}

function assertUniqueName(
  categories: Category[],
  type: CategoryType,
  name: string,
  excludedId?: string,
): void {
  const duplicate = categories.some(
    (category) =>
      category.type === type &&
      category.id !== excludedId &&
      category.name.localeCompare(name, "zh-Hant", {
        sensitivity: "accent",
      }) === 0,
  );

  if (duplicate) {
    throw new Error("此收支類別已存在");
  }
}

export function listCategories(type: CategoryType): Category[] {
  const validType = categoryTypeSchema.parse(type);
  return readCategories().filter((category) => category.type === validType);
}

export function createCategory(input: CategoryDraft): Category {
  const draft = categoryDraftSchema.parse(input);
  const name = normalizeName(draft.name);
  const categories = readCategories();
  assertUniqueName(categories, draft.type, name);

  const category = categorySchema.parse({
    id:
      globalThis.crypto?.randomUUID?.() ??
      `category-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: draft.type,
    name,
  });
  writeCategories([...categories, category]);

  return category;
}

export function renameCategory(id: string, nextName: string): Category {
  const name = normalizeName(nextName);
  const categories = readCategories();
  const currentCategory = categories.find((category) => category.id === id);
  if (!currentCategory) {
    throw new Error("找不到要重新命名的收支類別");
  }

  assertUniqueName(categories, currentCategory.type, name, currentCategory.id);
  if (currentCategory.name === name) {
    return currentCategory;
  }

  const renamed = { ...currentCategory, name };
  writeCategories(
    categories.map((category) => (category.id === id ? renamed : category)),
  );
  renameRecordCategory(currentCategory.type, currentCategory.name, name);

  return renamed;
}

export function deleteCategory(id: string): void {
  const categories = readCategories();
  const category = categories.find((candidate) => candidate.id === id);
  if (!category) {
    throw new Error("找不到要刪除的收支類別");
  }

  const isInUse = listRecords().some(
    (record) =>
      record.type === category.type && record.category === category.name,
  );
  if (isInUse) {
    throw new Error("請先重新分配使用中的收支紀錄");
  }

  writeCategories(categories.filter((candidate) => candidate.id !== id));
}
