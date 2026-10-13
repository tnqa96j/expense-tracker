import { describe, expect, it } from "vitest";
import {
  filterMonthlyRecords,
  summarizeMonthlyRecords,
} from "@/app/_lib/summary";
import type { RecordEntry } from "@/lib/records";

const records: RecordEntry[] = [
  {
    id: "income-salary",
    type: "income",
    amount: 52000,
    date: "2025-01-11",
    category: "薪資",
    note: "一月薪資",
  },
  {
    id: "income-bonus",
    type: "income",
    amount: 3000,
    date: "2025-01-25",
    category: "獎金",
    note: "",
  },
  {
    id: "expense-food",
    type: "expense",
    amount: 135,
    date: "2025-01-12",
    category: "飲食",
    note: "午餐",
  },
  {
    id: "income-next-month",
    type: "income",
    amount: 1000,
    date: "2025-02-01",
    category: "薪資",
    note: "",
  },
];

describe("月度摘要", () => {
  it("只彙總所選月份的收入、支出及各自類別金額", () => {
    expect(summarizeMonthlyRecords(records, "2025-01")).toEqual({
      incomeTotal: 55000,
      expenseTotal: 135,
      incomeByCategory: [
        { category: "獎金", amount: 3000 },
        { category: "薪資", amount: 52000 },
      ],
      expenseByCategory: [{ category: "飲食", amount: 135 }],
    });
  });

  it("沒有紀錄的月份顯示零總額及空類別明細", () => {
    expect(summarizeMonthlyRecords(records, "2025-03")).toEqual({
      incomeTotal: 0,
      expenseTotal: 0,
      incomeByCategory: [],
      expenseByCategory: [],
    });
  });

  it("依月份、收支類型及類別篩選紀錄", () => {
    expect(
      filterMonthlyRecords(records, {
        month: "2025-01",
        type: "income",
        category: "獎金",
      }).map(({ id }) => id),
    ).toEqual(["income-bonus"]);
  });

  it("加總小數金額時避免浮點誤差", () => {
    const decimalRecords: RecordEntry[] = [
      {
        id: "decimal-income-one",
        type: "income",
        amount: 0.1,
        date: "2025-01-02",
        category: "投資",
        note: "",
      },
      {
        id: "decimal-income-two",
        type: "income",
        amount: 0.2,
        date: "2025-01-03",
        category: "投資",
        note: "",
      },
    ];

    expect(summarizeMonthlyRecords(decimalRecords, "2025-01").incomeTotal).toBe(
      0.3,
    );
  });
});
