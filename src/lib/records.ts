import { z } from "zod";

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

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const recordFieldsSchema = z.object({
  amount: z.number().finite().positive("金額必須大於零"),
  date: z
    .string()
    .refine(isCalendarDate, "請輸入有效日期")
    .refine((date) => date <= getTodayDate(), "日期不可晚於今天"),
  note: z.string().max(500, "備註不可超過 500 個字").optional(),
});

export const recordDraftSchema = z.discriminatedUnion("type", [
  recordFieldsSchema.extend({
    type: z.literal("income"),
    category: z.enum(DEFAULT_INCOME_CATEGORIES),
  }),
  recordFieldsSchema.extend({
    type: z.literal("expense"),
    category: z.enum(DEFAULT_EXPENSE_CATEGORIES),
  }),
]);

const recordEntryFieldsSchema = recordFieldsSchema.extend({
  id: z.string().min(1),
  note: z.string().max(500),
});

export const recordEntrySchema = z.discriminatedUnion("type", [
  recordEntryFieldsSchema.extend({
    type: z.literal("income"),
    category: z.enum(DEFAULT_INCOME_CATEGORIES),
  }),
  recordEntryFieldsSchema.extend({
    type: z.literal("expense"),
    category: z.enum(DEFAULT_EXPENSE_CATEGORIES),
  }),
]);

export type RecordDraft = z.input<typeof recordDraftSchema>;
export type RecordEntry = z.infer<typeof recordEntrySchema>;
