import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("使用者可建立、編輯、重新載入後保留並刪除收支紀錄", async ({ page }) => {
  await page.getByLabel("金額").fill("52000");
  await page.getByLabel("備註").fill("一月薪資");
  await page.getByRole("button", { name: "新增紀錄" }).click();

  const record = page.getByRole("listitem").filter({ hasText: "一月薪資" });
  await expect(record).toContainText("NT$ 52,000");

  await page.reload();
  const restoredRecord = page
    .getByRole("listitem")
    .filter({ hasText: "一月薪資" });
  await expect(restoredRecord).toContainText("薪資");
  await expect(restoredRecord).toContainText("NT$ 52,000");

  await restoredRecord.getByRole("button", { name: "編輯薪資" }).click();
  await page.getByLabel("金額").fill("53000");
  await page.getByRole("button", { name: "儲存修改" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "一月薪資" }),
  ).toContainText("NT$ 53,000");

  await page.getByRole("button", { name: "刪除薪資" }).click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toContainText("刪除後無法復原");
  await confirmation.getByRole("button", { name: "確認刪除" }).click();
  await expect(page.getByText("還沒有收支紀錄")).toBeVisible();
});

test("預設今天為紀錄日期且限制不可選未來日期", async ({ page }) => {
  const date = page.getByLabel("日期");
  const today = new Date();
  const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  await expect(date).toHaveValue(expectedDate);
  await expect(date).toHaveAttribute("max", expectedDate);
});

test("重新命名會更新既有紀錄，重新分配後可刪除類別並在重新載入後保留", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "expense-tracker.records",
      JSON.stringify([
        {
          id: "category-e2e-income",
          type: "income",
          amount: 52000,
          date: "2025-01-11",
          category: "薪資",
          note: "一月薪資",
        },
      ]),
    );
  });
  await page.reload();

  const record = page.getByRole("listitem").filter({ hasText: "一月薪資" });
  await expect(record).toContainText("薪資");

  await page.getByRole("button", { name: "管理類別" }).click();
  const incomeCategories = page.getByRole("list", { name: "收入類別" });
  await incomeCategories.getByRole("button", { name: "重新命名薪資" }).click();
  await page.getByLabel("重新命名收入類別").fill("工作收入");
  await page.getByRole("button", { name: "儲存名稱" }).click();

  await expect(record).toContainText("工作收入");
  await expect(
    incomeCategories.getByRole("button", { name: "刪除工作收入" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "收起類別" }).click();
  await record.getByRole("button", { name: "編輯工作收入" }).click();
  await page.getByRole("button", { name: "獎金" }).click();
  await page.getByRole("button", { name: "儲存修改" }).click();
  await expect(record).toContainText("獎金");

  await page.getByRole("button", { name: "管理類別" }).click();
  await page
    .getByRole("list", { name: "收入類別" })
    .getByRole("button", { name: "刪除工作收入" })
    .click();
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("button", { name: "確認刪除" }).click();

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: "一月薪資" }),
  ).toContainText("獎金");
  await page.getByRole("button", { name: "管理類別" }).click();
  await expect(
    page.getByRole("list", { name: "收入類別" }).getByText("工作收入"),
  ).not.toBeVisible();
});
