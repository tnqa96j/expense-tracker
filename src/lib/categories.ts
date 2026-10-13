import { z } from "zod";

export const categoryTypeSchema = z.enum(["income", "expense"]);

export const DEFAULT_INCOME_CATEGORIES = [
  "薪資",
  "獎金",
  "投資",
  "其他收入",
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "飲食",
  "交通",
  "居住",
  "娛樂",
  "購物",
  "醫療",
  "其他支出",
] as const;

export const categorySchema = z.object({
  id: z.string().min(1),
  type: categoryTypeSchema,
  name: z.string().trim().min(1, "類別名稱不可空白"),
});

export const categoryDraftSchema = categorySchema.pick({
  type: true,
  name: true,
});

export type CategoryType = z.infer<typeof categoryTypeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CategoryDraft = z.infer<typeof categoryDraftSchema>;

export function getDefaultCategories(): Category[] {
  return [
    ...DEFAULT_INCOME_CATEGORIES.map((name, index) => ({
      id: `income-default-${index}`,
      type: "income" as const,
      name,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({
      id: `expense-default-${index}`,
      type: "expense" as const,
      name,
    })),
  ];
}
