import type { RecordEntry } from "@/lib/records";

const CSV_HEADERS = ["收支類型", "日期", "金額", "類別", "備註"];

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function serializeRecordsCsv(records: RecordEntry[]): string {
  const rows = records.map((record) => [
    record.type === "income" ? "收入" : "支出",
    record.date,
    String(record.amount),
    record.category,
    record.note,
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n")
    .concat("\r\n");
}

export function createRecordsCsvFileName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `個人帳本-${year}${month}${day}.csv`;
}

export function downloadRecordsCsv(records: RecordEntry[]): void {
  const file = new Blob([serializeRecordsCsv(records)], {
    type: "text/csv;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = createRecordsCsvFileName();
  link.click();
  URL.revokeObjectURL(objectUrl);
}
