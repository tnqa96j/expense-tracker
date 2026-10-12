# 專案指示（必須遵守）

本專案是一個記帳工具（expense-tracker）：單一使用者、手機優先的網頁、資料存在本機。
需求與範圍以 GitHub 上的 spec issue（#1）與各張票為準。

以下規則中的「必須」「禁止」沒有例外。若任務與規則衝突，停下來問我，不要自行變通。

## 1. 分支

- **禁止**直接在 `main` 上開發、commit 或 push。
- 開始任何票或改動前，**必須**先切到最新的 `main`，再建立新分支：
  - 功能：`feat/<issue編號>-<簡短英文描述>`
  - 修 bug：`fix/<issue編號>-<簡短英文描述>`
- 一個分支只做一張票。不要順手混入不相關的改動。
- 有依賴關係的票（被別的票擋住），**必須**等前置票的 PR 已 merge 進 `main`，再從更新後的 `main` 開新分支。

原因：`/implement` 會 commit 到「目前所在的分支」，分支必須在實作開始前就建好。

## 2. 實作流程

1. 先讀 spec（#1）與目標票的內容，**開工前先用幾句話說明你打算做什麼**，等我確認再動手。
2. 用 `/implement` 實作，盡量用 `/tdd`。
3. 實作中定期跑型別檢查與單一測試檔，最後跑一次完整測試。
4. 完成後**必須**跑 `/code-review`，有問題先修正，再 commit。
5. 不得擴大範圍：票沒寫的功能不要做。發現 spec 或票有缺漏或矛盾，停下來問我。

### 測試

- TDD 迴圈（紅、綠）中**只跑單一測試檔**；完整測試只在 `/implement` 結尾跑一次。
- 接縫（要測的公開介面）**優先選在 `src/services/` 與純函式**，不要把 e2e 當作迴圈內的測試。
- 邏輯用單元測試驗證（月度加總、日期規則、類別重新分配、CSV 內容、本機儲存讀寫）；UI 行為用元件測試（Testing Library），不開瀏覽器。
- Playwright e2e **只用於 3 到 5 條關鍵流程**，在發 PR 前跑一次，**禁止**放進 TDD 迴圈。
- 寫 e2e 時：開發階段只跑 Chromium、重用已啟動的開發伺服器、用預先寫入本機儲存的資料取代逐筆操作畫面，並避免固定等待時間。
- 要新增測試工具或改變測試分層時，先問我。

### Commit 訊息（慣例式提交，Conventional Commits）

所有 commit 訊息**必須**符合 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[選填內文：說明為什麼這樣改]

[選填頁尾：Refs #<issue編號>、BREAKING CHANGE: ...]
```

- `type` 只能使用：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。
- `scope` 選填，用一個詞標示影響範圍（例如 `transactions`、`categories`、`export`），盡量沿用詞彙表中的用語。
- `description` 使用英文祈使句（例如 `add transaction form`），開頭小寫、結尾不加句號，整行不超過 72 字元。
- 一個 commit 只包含一個邏輯變更；測試與對應的實作可以同一個 commit，但不要把不相關的改動混在一起。
- 破壞性變更（例如修改本機儲存的資料格式）**必須**在 type 後加 `!`（如 `feat(storage)!:`），並在頁尾寫 `BREAKING CHANGE:` 說明影響與遷移方式。
- 範例：
  - `feat(transactions): add income and expense form`
  - `fix(summary): exclude future dates from monthly totals`
  - `test(export): cover csv escaping of notes`
- 不符合格式的 commit 訊息，在 push 前修正，不要留到 PR。

## 3. Pull Request

- 完成後 push 分支，用 `gh pr create` 發 PR。
- PR 內文**必須**用 `pr` skill 的模板撰寫（Summary、Evidence、Merge Danger）。
- PR 內文最後**必須**加上 `Closes #<issue編號>`，讓票在 merge 時自動關閉。
- Evidence 的「Before」若是新功能而無從比較，改寫成新增的測試名稱與其通過結果。
- Merge Danger 要特別留意：**修改本機儲存的資料格式屬於單向門**（既有使用者的資料可能壞掉），必須明確標示並說明相容或遷移做法。
- 發完 PR 就停下來。**禁止**自行 merge、approve 或關閉 PR，merge 由我決定。

## 4. Issue 標題

建立任何 issue（spec、票、bug）時，標題**必須**使用與 commit 訊息相同的慣例式格式：

- 格式：`<type>(<scope>): <description>`，type 與 scope 的規則同「Commit 訊息」一節。
- 描述使用英文祈使句，開頭小寫、不加句號，整行不超過 72 字元。
- 一張票只描述一個可交付的結果，標題要看得出「做完會得到什麼」。
- spec 使用 `spec: <description>`。
- 順序與依賴關係用 issue 的阻擋關係表達，**不要**在標題加 `[1/4]` 之類的順序前綴。
- 範例：
  - `spec: expense tracker`
  - `feat(transactions): record and manage income and expenses`
  - `fix(summary): exclude future dates from monthly totals`
- 建立 issue 後**必須**檢查標題格式，不符合就用 `gh issue edit <編號> --title "..."` 修正。
- PR 標題沿用對應票的標題。

## 5. 用語

- 領域用語以專案的詞彙表為準（目前檔案：`glossy.md`）。程式、commit、PR、issue 中都使用其中的詞，不要自創同義詞。
- 遇到詞彙表沒有的新概念，列出來問我，不要自行命名後直接使用。

## 6. 修改範圍的底線

- **禁止**刪除或改寫既有的詞彙表、spec、ADR，除非我明確要求。
- **禁止**使用強制推送（`git push --force`）或改寫已推送的歷史。
- **禁止**在 commit 或 PR 中放入金鑰、密碼、token 或個人資料。

## 7. 不確定時

- 規則沒涵蓋的情況，選擇最保守、可回復的做法，並在回覆中說明你的判斷。
- 做完一件事就簡短回報結果，不要重述過程。