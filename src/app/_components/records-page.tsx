"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  ReceiptText,
  Settings2,
  Trash2,
} from "lucide-react";
import numeral from "numeral";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import CategoryManager from "@/app/_components/category-manager";
import { downloadRecordsCsv } from "@/app/_lib/export";
import {
  filterMonthlyRecords,
  summarizeMonthlyRecords,
} from "@/app/_lib/summary";
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  getTodayDate,
  type RecordDraft,
  type RecordEntry,
  recordDraftSchema,
} from "@/lib/records";
import { listCategories } from "@/services/categories";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "@/services/records";

const defaultValues = (): RecordDraft => ({
  type: "income",
  amount: 0,
  date: getTodayDate(),
  category: "薪資",
  note: "",
});

const filterParsers = {
  month: parseAsString.withDefault(dayjs().format("YYYY-MM")),
  type: parseAsStringLiteral(["all", "income", "expense"] as const).withDefault(
    "all",
  ),
  category: parseAsString.withDefault("all"),
};

function RecordTypeIcon({ type }: { type: RecordEntry["type"] }) {
  return type === "income" ? (
    <ArrowDownLeft aria-hidden="true" className="size-5" />
  ) : (
    <ArrowUpRight aria-hidden="true" className="size-5" />
  );
}

function formatAmount(amount: number): string {
  return `NT$ ${numeral(amount).format("0,0.[00]")}`;
}

export default function RecordsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useQueryStates(filterParsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<RecordEntry | null>(
    null,
  );
  const form = useForm<RecordDraft>({
    defaultValues: defaultValues(),
    resolver: zodResolver(recordDraftSchema),
  });
  const selectedType = form.watch("type");
  const today = getTodayDate();
  const recordsQuery = useQuery({
    queryFn: listRecords,
    queryKey: ["records"],
  });
  const categoriesQuery = useQuery({
    queryFn: () => ({
      income: listCategories("income"),
      expense: listCategories("expense"),
    }),
    queryKey: ["categories"],
  });
  const saveMutation = useMutation({
    mutationFn: async (draft: RecordDraft) =>
      editingId ? updateRecord(editingId, draft) : createRecord(draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      setEditingId(null);
      form.reset(defaultValues());
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteRecord(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      setDeletingRecord(null);
    },
  });
  const records = [...(recordsQuery.data ?? [])].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
  const month = /^\d{4}-\d{2}$/.test(filters.month)
    ? filters.month
    : dayjs().format("YYYY-MM");
  const summary = summarizeMonthlyRecords(records, month);
  const visibleRecords = filterMonthlyRecords(records, {
    month,
    type: filters.type,
    category: filters.category,
  });
  const categoryFilterOptions = [
    ...(filters.type === "all" || filters.type === "income"
      ? (categoriesQuery.data?.income ?? [])
      : []),
    ...(filters.type === "all" || filters.type === "expense"
      ? (categoriesQuery.data?.expense ?? [])
      : []),
  ].filter(
    (category, index, categories) =>
      categories.findIndex((candidate) => candidate.name === category.name) ===
      index,
  );

  const handleTypeChange = (type: RecordDraft["type"]) => {
    const nextCategory = categoriesQuery.data?.[type][0]?.name ?? "";
    form.setValue("type", type, { shouldDirty: true, shouldValidate: true });
    form.setValue("category", nextCategory, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const changeMonth = (offset: number) => {
    const nextMonth = dayjs(`${month}-01`)
      .add(offset, "month")
      .format("YYYY-MM");
    void setFilters({ month: nextMonth });
  };

  const handleEdit = (record: RecordEntry) => {
    setEditingId(record.id);
    const { id: _id, ...draft } = record;
    form.reset(draft);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset(defaultValues());
  };

  const handleSubmit = form.handleSubmit((draft) => saveMutation.mutate(draft));

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between rounded-3xl border border-emerald-950/10 bg-white px-5 py-4 shadow-sm sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-800 text-white">
              <ReceiptText aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-950">
                日日記帳
              </p>
              <p className="text-xs text-slate-500">你的個人收支簿</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            僅儲存於此裝置
          </span>
        </header>

        <section className="mb-7 mt-8 flex flex-col justify-between gap-4 sm:mb-9 sm:mt-10 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-emerald-800">
              個人帳本
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              每一筆收支，都記得清楚。
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              簡單記下收入與支出，讓日常花費一目了然。資料安全儲存在你的裝置中。
            </p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:self-auto">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <CalendarDays aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">帳本紀錄</p>
              <p className="text-lg font-bold text-slate-900">
                {records.length}{" "}
                <span className="text-sm font-medium text-slate-500">筆</span>
              </p>
            </div>
            <Button
              aria-controls="category-manager"
              aria-expanded={categoryManagerOpen}
              onClick={() => setCategoryManagerOpen((open) => !open)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Settings2 aria-hidden="true" className="size-4" />
              {categoryManagerOpen ? "收起類別" : "管理類別"}
            </Button>
          </div>
        </section>

        <section
          aria-labelledby="monthly-summary-title"
          className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                個人帳本回顧
              </p>
              <h2
                className="mt-1 text-xl font-bold tracking-tight text-slate-950"
                id="monthly-summary-title"
              >
                {dayjs(`${month}-01`).format("YYYY年M月")}月度摘要
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                aria-label="上個月"
                onClick={() => changeMonth(-1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <Field>
                <FieldLabel className="sr-only" htmlFor="summary-month">
                  摘要月份
                </FieldLabel>
                <Input
                  className="w-40"
                  id="summary-month"
                  onChange={(event) => {
                    if (/^\d{4}-\d{2}$/.test(event.currentTarget.value)) {
                      void setFilters({ month: event.currentTarget.value });
                    }
                  }}
                  type="month"
                  value={month}
                />
              </Field>
              <Button
                aria-label="下個月"
                onClick={() => changeMonth(1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
              <Button
                disabled={recordsQuery.isPending || recordsQuery.isError}
                onClick={() => downloadRecordsCsv(records)}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" className="size-4" />
                匯出 CSV
              </Button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-emerald-800">收入總額</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">
                {formatAmount(summary.incomeTotal)}
              </p>
              <ul aria-label="收入類別摘要" className="mt-3 space-y-1.5">
                {summary.incomeByCategory.length === 0 ? (
                  <li className="text-sm text-emerald-800/70">尚無收入紀錄</li>
                ) : (
                  summary.incomeByCategory.map(({ category, amount }) => (
                    <li
                      className="flex justify-between gap-3 text-sm text-emerald-900"
                      key={category}
                    >
                      <span>{category}</span>
                      <span className="font-semibold tabular-nums">
                        {formatAmount(amount)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-rose-800">支出總額</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-rose-950">
                {formatAmount(summary.expenseTotal)}
              </p>
              <ul aria-label="支出類別摘要" className="mt-3 space-y-1.5">
                {summary.expenseByCategory.length === 0 ? (
                  <li className="text-sm text-rose-800/70">尚無支出紀錄</li>
                ) : (
                  summary.expenseByCategory.map(({ category, amount }) => (
                    <li
                      className="flex justify-between gap-3 text-sm text-rose-900"
                      key={category}
                    >
                      <span>{category}</span>
                      <span className="font-semibold tabular-nums">
                        {formatAmount(amount)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-5">
            <fieldset
              aria-label="收支類型篩選"
              className="flex flex-wrap items-center gap-2"
            >
              <legend className="mr-2 text-sm font-semibold text-slate-700">
                收支類型
              </legend>
              {(
                [
                  ["all", "全部"],
                  ["income", "收入"],
                  ["expense", "支出"],
                ] as const
              ).map(([type, label]) => (
                <Button
                  aria-pressed={filters.type === type}
                  className={
                    filters.type === type
                      ? "bg-emerald-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                  key={type}
                  onClick={() => void setFilters({ type, category: "all" })}
                  size="sm"
                  type="button"
                >
                  {label}
                </Button>
              ))}
            </fieldset>
            <fieldset
              aria-label="收支類別篩選"
              className="flex flex-wrap items-center gap-2"
            >
              <legend className="mr-2 text-sm font-semibold text-slate-700">
                收支類別
              </legend>
              <Button
                aria-pressed={filters.category === "all"}
                className={
                  filters.category === "all"
                    ? "bg-emerald-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
                onClick={() => void setFilters({ category: "all" })}
                size="sm"
                type="button"
              >
                全部類別
              </Button>
              {categoryFilterOptions.map(({ id, name }) => (
                <Button
                  aria-pressed={filters.category === name}
                  className={
                    filters.category === name
                      ? "bg-emerald-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                  key={id}
                  onClick={() => void setFilters({ category: name })}
                  size="sm"
                  type="button"
                >
                  {name}
                </Button>
              ))}
            </fieldset>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  {editingId ? "編輯收支" : "新增收支"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  金額、日期與類別，備註選填
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                {editingId ? (
                  <Pencil aria-hidden="true" className="size-4" />
                ) : (
                  <Plus aria-hidden="true" className="size-5" />
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <fieldset
                    aria-label="收支類型"
                    className="grid grid-cols-2 gap-2"
                    disabled={categoriesQuery.isPending}
                  >
                    <legend className="col-span-2 mb-2 text-sm font-semibold text-slate-700">
                      收支類型
                    </legend>
                    <Button
                      aria-pressed={selectedType === "income"}
                      className={
                        selectedType === "income"
                          ? "bg-emerald-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }
                      onClick={() => handleTypeChange("income")}
                      type="button"
                    >
                      <ArrowDownLeft aria-hidden="true" className="size-4" />
                      收入
                    </Button>
                    <Button
                      aria-pressed={selectedType === "expense"}
                      className={
                        selectedType === "expense"
                          ? "bg-rose-600 text-white hover:bg-rose-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }
                      onClick={() => handleTypeChange("expense")}
                      type="button"
                    >
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                      支出
                    </Button>
                  </fieldset>
                </Field>

                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>金額</FieldLabel>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                          NT$
                        </span>
                        <Input
                          aria-invalid={fieldState.invalid}
                          className="pl-14 text-lg font-semibold tabular-nums"
                          id={field.name}
                          min="0.01"
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={(event) =>
                            field.onChange(Number(event.currentTarget.value))
                          }
                          placeholder="0"
                          ref={field.ref}
                          step="0.01"
                          type="number"
                          value={field.value || ""}
                        />
                      </div>
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="date"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>日期</FieldLabel>
                      <Input
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        max={today}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        type="date"
                        value={field.value}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field>
                      <fieldset
                        aria-label="收支類別"
                        className="flex flex-wrap gap-2"
                      >
                        <legend className="mb-2 w-full text-sm font-semibold text-slate-700">
                          類別
                        </legend>
                        {(categoriesQuery.data?.[selectedType] ?? []).map(
                          ({ name: category }) => (
                            <Button
                              aria-pressed={field.value === category}
                              className={
                                field.value === category
                                  ? "bg-emerald-800 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }
                              key={category}
                              onClick={() => field.onChange(category)}
                              size="sm"
                              type="button"
                            >
                              {category}
                            </Button>
                          ),
                        )}
                      </fieldset>
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="note"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>備註</FieldLabel>
                      <Input
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        maxLength={500}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        placeholder="例如：一月薪資"
                        ref={field.ref}
                        type="text"
                        value={field.value ?? ""}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                {saveMutation.isError && (
                  <p className="text-sm font-medium text-rose-600" role="alert">
                    儲存失敗，請稍後再試。
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <Button
                    className="w-full"
                    disabled={saveMutation.isPending}
                    type="submit"
                  >
                    {saveMutation.isPending
                      ? "儲存中…"
                      : editingId
                        ? "儲存修改"
                        : "新增紀錄"}
                  </Button>
                  {editingId && (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={handleCancelEdit}
                      type="button"
                      variant="outline"
                    >
                      取消修改
                    </Button>
                  )}
                </div>
              </FieldGroup>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  {dayjs(`${month}-01`).format("YYYY年M月")}收支紀錄
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {visibleRecords.length} 筆符合目前篩選
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {visibleRecords.length} 筆
              </span>
            </div>

            {recordsQuery.isPending ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                正在載入本機紀錄…
              </p>
            ) : recordsQuery.isError ? (
              <p
                className="rounded-2xl bg-rose-50 px-4 py-8 text-center text-sm text-rose-700"
                role="alert"
              >
                無法載入本機紀錄。
              </p>
            ) : visibleRecords.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <ReceiptText aria-hidden="true" className="size-5" />
                </div>
                <p className="font-semibold text-slate-800">
                  {records.length === 0
                    ? "還沒有收支紀錄"
                    : "沒有符合條件的收支紀錄"}
                </p>
                <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                  從左側新增第一筆收入或支出，讓個人帳本開始累積。
                </p>
              </div>
            ) : (
              <ul aria-label="篩選後的收支紀錄" className="space-y-3">
                {visibleRecords.map((record) => (
                  <li
                    className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm sm:p-5"
                    key={record.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${record.type === "income" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}
                        >
                          <RecordTypeIcon type={record.type} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {record.category}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {dayjs(record.date).format("YYYY/MM/DD")}
                            {record.note && (
                              <span className="ml-2">· {record.note}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`shrink-0 text-right font-bold tabular-nums ${record.type === "income" ? "text-emerald-800" : "text-slate-900"}`}
                      >
                        {record.type === "income" ? "+" : "−"}
                        {formatAmount(record.amount)}
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                      <Button
                        aria-label={`編輯${record.category}`}
                        onClick={() => handleEdit(record)}
                        size="sm"
                        variant="ghost"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        編輯
                      </Button>
                      <Button
                        aria-label={`刪除${record.category}`}
                        onClick={() => setDeletingRecord(record)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        刪除
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {categoryManagerOpen && (
          <div className="mt-6" id="category-manager">
            <CategoryManager />
          </div>
        )}

        <AlertDialogRoot
          onOpenChange={(open) => {
            if (!open) setDeletingRecord(null);
          }}
          open={Boolean(deletingRecord)}
        >
          <AlertDialogContent>
            <AlertDialogTitle>刪除收支紀錄</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除這筆收支紀錄嗎？刪除後無法復原。
            </AlertDialogDescription>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                onClick={() => setDeletingRecord(null)}
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deletingRecord) deleteMutation.mutate(deletingRecord.id);
                }}
                type="button"
                variant="destructive"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                確認刪除
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialogRoot>
      </div>
    </main>
  );
}
