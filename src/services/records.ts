import {
  type RecordDraft,
  type RecordEntry,
  recordDraftSchema,
  recordEntrySchema,
} from "@/lib/records";
import { findStoredCategory } from "@/services/category-store";

const STORAGE_KEY = "expense-tracker.records";

function getStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function readRecords(): RecordEntry[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  try {
    const stored: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    const result = recordEntrySchema.array().safeParse(stored);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

function writeRecords(records: RecordEntry[]): void {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `record-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function listRecords(): RecordEntry[] {
  return readRecords();
}

export function createRecord(input: RecordDraft): RecordEntry {
  const draft = recordDraftSchema.parse(input);
  if (!findStoredCategory(draft.type, draft.category)) {
    throw new Error("請選擇有效的收支類別");
  }
  const created = recordEntrySchema.parse({
    ...draft,
    id: createId(),
    note: draft.note ?? "",
  });
  const records = readRecords();

  writeRecords([...records, created]);

  return created;
}

export function updateRecord(id: string, input: RecordDraft): RecordEntry {
  const draft = recordDraftSchema.parse(input);
  if (!findStoredCategory(draft.type, draft.category)) {
    throw new Error("請選擇有效的收支類別");
  }
  const records = readRecords();
  const recordIndex = records.findIndex((record) => record.id === id);

  if (recordIndex === -1) {
    throw new Error("找不到要更新的收支紀錄");
  }

  const updated = recordEntrySchema.parse({
    ...draft,
    id,
    note: draft.note ?? "",
  });
  records[recordIndex] = updated;
  writeRecords(records);

  return updated;
}

export function deleteRecord(id: string): void {
  writeRecords(readRecords().filter((record) => record.id !== id));
}

export function renameRecordCategory(
  type: RecordEntry["type"],
  previousName: string,
  nextName: string,
): void {
  writeRecords(
    readRecords().map((record) =>
      record.type === type && record.category === previousName
        ? { ...record, category: nextName }
        : record,
    ),
  );
}
