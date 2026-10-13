import {
  type Category,
  type CategoryType,
  categorySchema,
  getDefaultCategories,
} from "@/lib/categories";

const STORAGE_KEY = "expense-tracker.categories";

function getStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

export function readCategories(): Category[] {
  const storage = getStorage();
  if (!storage) {
    return getDefaultCategories();
  }

  try {
    const stored: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    const parsed = categorySchema.array().safeParse(stored);
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // Fall back to the built-in categories when no valid category list exists.
  }

  const defaults = getDefaultCategories();
  storage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

export function writeCategories(categories: Category[]): void {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function findStoredCategory(
  type: CategoryType,
  name: string,
): Category | undefined {
  return readCategories().find(
    (category) => category.type === type && category.name === name,
  );
}
