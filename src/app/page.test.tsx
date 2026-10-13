import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RecordsPage from "@/app/_components/records-page";
import { createRecord } from "@/services/records";

function renderRecordsPage(searchParams = "") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter hasMemory searchParams={searchParams}>
        <RecordsPage />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("收支紀錄畫面", () => {
  it("可建立、編輯，並在確認後刪除收入紀錄", async () => {
    const user = userEvent.setup();
    renderRecordsPage();

    await user.type(screen.getByLabelText("金額"), "52000");
    await user.type(screen.getByLabelText("備註"), "一月薪資");
    await user.click(screen.getByRole("button", { name: "新增紀錄" }));

    const record = await screen.findByText(/一月薪資/);
    expect(record).toBeInTheDocument();
    const savedRecord = within(
      screen.getByRole("list", { name: "篩選後的收支紀錄" }),
    ).getByRole("listitem");
    expect(within(savedRecord).getByText("薪資")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "編輯薪資" }));
    const amountInput = screen.getByLabelText("金額");
    await user.clear(amountInput);
    await user.type(amountInput, "53000");
    await user.click(screen.getByRole("button", { name: "儲存修改" }));
    expect(await screen.findAllByText(/NT\$ 53,000/)).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "刪除薪資" }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText(/確定要刪除這筆收支紀錄嗎/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "確認刪除" }));

    await waitFor(() => {
      expect(screen.queryByText("一月薪資")).not.toBeInTheDocument();
    });
  });

  it("新增紀錄的日期預設為今天，且不允許選擇未來日期", () => {
    renderRecordsPage();
    const date = screen.getByLabelText("日期");
    const today = new Date();
    const expectedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    expect(date).toHaveValue(expectedToday);
    expect(date).toHaveAttribute("max", expectedToday);
  });

  it("切換到支出時提供支出類別，取消刪除確認時保留紀錄", async () => {
    const user = userEvent.setup();
    createRecord({
      type: "expense",
      amount: 135,
      date: "2025-01-12",
      category: "飲食",
      note: "午餐",
    });
    renderRecordsPage("?month=2025-01");

    await user.click(
      within(screen.getByRole("group", { name: "收支類型" })).getByRole(
        "button",
        { name: "支出" },
      ),
    );
    expect(screen.getAllByRole("button", { name: "飲食" })).toHaveLength(2);
    expect(
      within(screen.getByRole("group", { name: "收支類別" })).queryByRole(
        "button",
        { name: "薪資" },
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "刪除飲食" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "取消" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "篩選後的收支紀錄" })).getByRole(
        "listitem",
      ),
    ).toHaveTextContent("午餐");
  });

  it("可新增、重新命名及刪除未使用的收入類別", async () => {
    const user = userEvent.setup();
    renderRecordsPage();

    await user.click(screen.getByRole("button", { name: "管理類別" }));
    const incomeCategories = screen.getByRole("list", { name: "收入類別" });
    await user.type(screen.getByLabelText("新增收入類別"), "稿費");
    await user.click(screen.getByRole("button", { name: "新增類別" }));
    expect(
      await within(incomeCategories).findByText("稿費"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "稿費" })).toHaveLength(2);

    await user.click(
      within(incomeCategories).getByRole("button", { name: "重新命名稿費" }),
    );
    const nameInput = screen.getByLabelText("重新命名收入類別");
    await user.clear(nameInput);
    await user.type(nameInput, "專案收入");
    await user.click(screen.getByRole("button", { name: "儲存名稱" }));
    expect(
      await within(incomeCategories).findByText("專案收入"),
    ).toBeInTheDocument();

    await user.click(
      within(incomeCategories).getByRole("button", { name: "刪除專案收入" }),
    );
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "確認刪除" }));
    await waitFor(() => {
      expect(
        within(incomeCategories).queryByText("專案收入"),
      ).not.toBeInTheDocument();
    });
  });

  it("停用仍有收支紀錄使用中的類別刪除操作", async () => {
    const user = userEvent.setup();
    createRecord({
      type: "income",
      amount: 52000,
      date: "2025-01-11",
      category: "薪資",
    });
    renderRecordsPage();

    await user.click(screen.getByRole("button", { name: "管理類別" }));

    expect(
      screen.getByText("1 筆紀錄使用中，請先重新分配紀錄"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "收入類別" })).getByRole(
        "button",
        {
          name: "刪除薪資",
        },
      ),
    ).toBeDisabled();
  });

  it("依月份呈現完整月度摘要，並依收支類型及類別篩選紀錄", async () => {
    const user = userEvent.setup();
    createRecord({
      type: "income",
      amount: 52000,
      date: "2025-01-11",
      category: "薪資",
      note: "一月薪資",
    });
    createRecord({
      type: "income",
      amount: 3000,
      date: "2025-01-25",
      category: "獎金",
      note: "年終",
    });
    createRecord({
      type: "expense",
      amount: 135,
      date: "2025-01-12",
      category: "飲食",
      note: "午餐",
    });
    createRecord({
      type: "income",
      amount: 1000,
      date: "2025-02-01",
      category: "薪資",
      note: "二月薪資",
    });
    renderRecordsPage("?month=2025-01");

    expect(await screen.findByText("NT$ 55,000")).toBeInTheDocument();
    expect(screen.getAllByText("NT$ 135")).toHaveLength(2);
    expect(screen.getByText(/一月薪資/)).toBeInTheDocument();
    expect(screen.queryByText(/二月薪資/)).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole("group", { name: "收支類型篩選" })).getByRole(
        "button",
        { name: "支出" },
      ),
    );
    const filteredRecordList = () =>
      within(screen.getByRole("list", { name: "篩選後的收支紀錄" }));
    expect(
      filteredRecordList().queryByText(/一月薪資/),
    ).not.toBeInTheDocument();
    expect(filteredRecordList().getByText(/午餐/)).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("group", { name: "收支類別篩選" })).getByRole(
        "button",
        { name: "飲食" },
      ),
    );
    expect(filteredRecordList().getByText(/午餐/)).toBeInTheDocument();
  });
});
