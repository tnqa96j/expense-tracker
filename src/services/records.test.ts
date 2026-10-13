import { beforeEach, describe, expect, it } from "vitest";
import type { RecordDraft } from "@/lib/records";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "@/services/records";

const incomeDraft: RecordDraft = {
  type: "income",
  amount: 52000,
  date: "2025-01-11",
  category: "薪資",
  note: "一月薪資",
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("本機收支紀錄", () => {
  it("建立收入後會出現在紀錄清單，並保存在本機", () => {
    const created = createRecord(incomeDraft);

    expect(created).toMatchObject(incomeDraft);
    expect(created.id).toBeTruthy();
    expect(listRecords()).toEqual([created]);
  });

  it("建立支出並省略備註時，備註為空字串", () => {
    const created = createRecord({
      type: "expense",
      amount: 135,
      date: "2025-01-12",
      category: "飲食",
    });

    expect(created.note).toBe("");
    expect(listRecords()).toEqual([created]);
  });

  it("更新紀錄時保留識別碼並呈現新資料", () => {
    const created = createRecord(incomeDraft);

    const updated = updateRecord(created.id, {
      ...incomeDraft,
      amount: 53000,
      note: "更正薪資",
    });

    expect(updated).toMatchObject({
      ...incomeDraft,
      amount: 53000,
      note: "更正薪資",
      id: created.id,
    });
    expect(listRecords()).toEqual([updated]);
  });

  it("刪除紀錄後清單不再包含該筆紀錄", () => {
    const created = createRecord(incomeDraft);

    deleteRecord(created.id);

    expect(listRecords()).toEqual([]);
  });

  it("拒絕未來日期及不符合收支種類的預設類別", () => {
    expect(() => createRecord({ ...incomeDraft, amount: 0 })).toThrow();
    expect(() =>
      createRecord({ ...incomeDraft, date: "9999-12-31" }),
    ).toThrow();
    expect(() => createRecord({ ...incomeDraft, category: "飲食" })).toThrow(
      "請選擇有效的收支類別",
    );
  });
});
