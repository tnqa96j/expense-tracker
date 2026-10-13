import type { RecordEntry } from "@/lib/records";

export type CategoryTotal = {
  category: string;
  amount: number;
};

export type MonthlySummary = {
  incomeTotal: number;
  expenseTotal: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
};

export type MonthlyRecordFilters = {
  month: string;
  type: RecordEntry["type"] | "all";
  category: string;
};

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

function fromMinorUnits(amount: number): number {
  return amount / 100;
}

function summarizeCategoryTotals(records: RecordEntry[]): CategoryTotal[] {
  const totals = new Map<string, number>();

  for (const record of records) {
    totals.set(
      record.category,
      (totals.get(record.category) ?? 0) + toMinorUnits(record.amount),
    );
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: fromMinorUnits(amount),
    }))
    .sort((left, right) =>
      left.category.localeCompare(right.category, "zh-Hant"),
    );
}

export function summarizeMonthlyRecords(
  records: RecordEntry[],
  month: string,
): MonthlySummary {
  const monthRecords = records.filter((record) =>
    record.date.startsWith(`${month}-`),
  );
  const incomeRecords = monthRecords.filter(
    (record) => record.type === "income",
  );
  const expenseRecords = monthRecords.filter(
    (record) => record.type === "expense",
  );

  const sum = (entries: RecordEntry[]) =>
    fromMinorUnits(
      entries.reduce((total, record) => total + toMinorUnits(record.amount), 0),
    );

  return {
    incomeTotal: sum(incomeRecords),
    expenseTotal: sum(expenseRecords),
    incomeByCategory: summarizeCategoryTotals(incomeRecords),
    expenseByCategory: summarizeCategoryTotals(expenseRecords),
  };
}

export function filterMonthlyRecords(
  records: RecordEntry[],
  filters: MonthlyRecordFilters,
): RecordEntry[] {
  return records.filter(
    (record) =>
      record.date.startsWith(`${filters.month}-`) &&
      (filters.type === "all" || record.type === filters.type) &&
      (filters.category === "all" || record.category === filters.category),
  );
}
