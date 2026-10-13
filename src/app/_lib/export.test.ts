import { describe, expect, it } from "vitest";
import { serializeRecordsCsv } from "@/app/_lib/export";
import type { RecordEntry } from "@/lib/records";

const records: RecordEntry[] = [
  {
    id: "income-1",
    type: "income",
    amount: 52000,
    date: "2025-01-11",
    category: "薪資",
    note: "一月薪資",
  },
  {
    id: "expense-1",
    type: "expense",
    amount: 135.5,
    date: "2025-01-12",
    category: "飲食",
    note: '午餐, "最好吃"\n再來一碗',
  },
  {
    id: "expense-2",
    type: "expense",
    amount: 25,
    date: "2025-01-13",
    category: "交通",
    note: "",
  },
];

describe("收支紀錄 CSV", () => {
  it("輸出所有收支欄位、純數字金額與符合 CSV 規則的特殊文字", () => {
    expect(serializeRecordsCsv(records)).toBe(
      [
        "收支類型,日期,金額,類別,備註",
        "收入,2025-01-11,52000,薪資,一月薪資",
        '支出,2025-01-12,135.5,飲食,"午餐, ""最好吃""\n再來一碗"',
        "支出,2025-01-13,25,交通,",
        "",
      ].join("\r\n"),
    );
  });

  it("空帳本仍輸出帶欄位標頭的有效 CSV", () => {
    expect(serializeRecordsCsv([])).toBe("收支類型,日期,金額,類別,備註\r\n");
  });
});
