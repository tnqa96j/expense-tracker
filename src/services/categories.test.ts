import { beforeEach, describe, expect, it } from "vitest";
import type { CategoryType } from "@/lib/categories";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "@/services/categories";
import { createRecord, listRecords, updateRecord } from "@/services/records";

function findCategory(type: CategoryType, name: string) {
  const category = listCategories(type).find(
    (candidate) => candidate.name === name,
  );
  if (!category) {
    throw new Error(`找不到預設類別：${name}`);
  }

  return category;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("本機收支類別", () => {
  it("首次讀取時提供分開的預設收入類別與支出類別", () => {
    expect(listCategories("income").map(({ name }) => name)).toEqual([
      "薪資",
      "獎金",
      "投資",
      "其他收入",
    ]);
    expect(listCategories("expense").map(({ name }) => name)).toEqual([
      "飲食",
      "交通",
      "居住",
      "娛樂",
      "購物",
      "醫療",
      "其他支出",
    ]);
  });

  it("新增類別只會加入指定的收入或支出清單", () => {
    const created = createCategory({ type: "income", name: "稿費" });

    expect(created).toMatchObject({ type: "income", name: "稿費" });
    expect(listCategories("income").map(({ name }) => name)).toContain("稿費");
    expect(listCategories("expense").map(({ name }) => name)).not.toContain(
      "稿費",
    );
  });

  it("同名收入類別與支出類別彼此獨立", () => {
    const income = createCategory({ type: "income", name: "稿費" });
    const expense = createCategory({ type: "expense", name: "稿費" });

    expect(income.id).not.toBe(expense.id);
    expect(listCategories("income")).toContainEqual(income);
    expect(listCategories("expense")).toContainEqual(expense);
  });

  it("重新命名類別會同步更新同類別的既有收支紀錄", () => {
    const salary = findCategory("income", "薪資");
    const record = createRecord({
      type: "income",
      amount: 52000,
      date: "2025-01-11",
      category: "薪資",
    });

    const renamed = renameCategory(salary.id, "工作收入");

    expect(renamed.name).toBe("工作收入");
    expect(listRecords().find(({ id }) => id === record.id)?.category).toBe(
      "工作收入",
    );
  });

  it("不允許刪除仍被收支紀錄使用的類別", () => {
    const salary = findCategory("income", "薪資");
    createRecord({
      type: "income",
      amount: 52000,
      date: "2025-01-11",
      category: "薪資",
    });

    expect(() => deleteCategory(salary.id)).toThrow(
      "請先重新分配使用中的收支紀錄",
    );
    expect(listCategories("income").map(({ name }) => name)).toContain("薪資");
  });

  it("收支紀錄重新分配到相同類型的類別後即可刪除舊類別", () => {
    const salary = findCategory("income", "薪資");
    const otherIncome = findCategory("income", "其他收入");
    const record = createRecord({
      type: "income",
      amount: 52000,
      date: "2025-01-11",
      category: "薪資",
    });

    updateRecord(record.id, { ...record, category: otherIncome.name });
    deleteCategory(salary.id);

    expect(listCategories("income").map(({ name }) => name)).not.toContain(
      "薪資",
    );
    expect(listRecords().find(({ id }) => id === record.id)?.category).toBe(
      "其他收入",
    );
  });

  it("拒絕空白名稱與同類別清單中的重複名稱", () => {
    expect(() => createCategory({ type: "income", name: "   " })).toThrow();
    expect(() => createCategory({ type: "income", name: " 薪資 " })).toThrow();
  });
});
