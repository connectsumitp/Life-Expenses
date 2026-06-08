import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9300 + Math.floor(Math.random() * 400);
const appUrl = "http://localhost:5173/";
const screenshotDir = path.resolve(".uat-screenshots");
const profileDir = path.resolve(`.chrome-uat-profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

const devices = [
  { name: "desktop-1440", width: 1440, height: 900, mobile: false, dpr: 1 },
  { name: "desktop-1024", width: 1024, height: 768, mobile: false, dpr: 1 },
  { name: "laptop-1366", width: 1366, height: 768, mobile: false, dpr: 1 },
  { name: "tablet-768", width: 768, height: 1024, mobile: true, dpr: 2 },
  { name: "ios-se-375", width: 375, height: 667, mobile: true, dpr: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "ios-landscape-844", width: 844, height: 390, mobile: true, dpr: 3, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "android-small-320", width: 320, height: 568, mobile: true, dpr: 2, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36" },
  { name: "ios-14-390", width: 390, height: 844, mobile: true, dpr: 3, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "android-360", width: 360, height: 800, mobile: true, dpr: 3, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36" },
  { name: "android-412", width: 412, height: 915, mobile: true, dpr: 2.625, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36" },
];

const results = [];

function record(name, pass, details = "") {
  results.push({ name, pass: Boolean(pass), details });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(url, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // keep trying
    }
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.onMessage(event));
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }
    const callbacks = this.listeners.get(message.method) || [];
    callbacks.forEach((callback) => callback(message.params || {}));
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 15000);
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const callback = (params) => {
        this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== callback));
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) || []), callback]);
    });
  }

  close() {
    this.ws.close();
  }
}

async function evalInPage(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result?.value;
}

function stubScript() {
  const categoryNames = [
    ["Daily Essentials", "Needs"],
    ["Life Enjoyment", "Wants"],
    ["Commuting", "Needs"],
    ["Home & Utilities", "Needs"],
    ["Health & Fitness", "Needs"],
    ["Personal Care", "Wants"],
    ["Subscriptions", "Wants"],
    ["Investments", "Savings"],
  ];
  const tx = Array.from({ length: 60 }, (_, index) => {
    const category = categoryNames[index % categoryNames.length];
    const direction = index % 13 === 0 ? "income" : "expense";
    return {
      id: `uat-${index}`,
      amount: direction === "income" ? 2500 + index : 110 + index,
      direction,
      category: direction === "income" ? "Salary" : category[0],
      accountId: index % 2 ? "hdfc" : "sbi",
      bucket: direction === "income" ? "Income" : category[1],
      timestamp: new Date(2026, 5, (index % 28) + 1, 9, 0).toISOString(),
      date: "2026-06-03",
      dayString: "Wed",
      monthString: "Jun 2026",
      monthNumber: 6,
      year: 2026,
      weekNumber: 23,
      weekOfMonth: Math.min(4, Math.ceil(((index % 28) + 1) / 7)),
      note: index % 9 === 0 || index % 8 === 1 ? `UAT note ${index}` : "",
    };
  });
  return `
    (() => {
      const categories = ${JSON.stringify(categoryNames.map(([name, bucket]) => ({ name, bucket })))};
      const categoryBuckets = Object.fromEntries(categories.map((item) => [item.name, item.bucket]));
      const accounts = [
        { id: "sbi", name: "SBI Account", type: "Bank", balance: 42000 },
        { id: "hdfc", name: "HDFC Account", type: "Bank", balance: 28500 },
        { id: "cash", name: "Cash Reserve", type: "Cash", balance: 6800 },
        { id: "stocks", name: "Stocks", type: "Market", balance: 72500 },
        { id: "mutualFunds", name: "Mutual Funds", type: "Market", balance: 126000 }
      ];
      const transactions = ${JSON.stringify(tx)};
      const dashboard = {
        ok: true,
        transactions,
        accounts,
        categories,
        categoryBuckets,
        assets: { mutualFunds: 126000, stocks: 72500 },
        cells: { C16: 126000, C17: 72500 },
        totalBurn: 8120,
        savingsRate: 28,
        unplanned: 420
      };
      window.__uatPosts = [];
      try {
        localStorage.removeItem("life-expenses.accounts");
        localStorage.removeItem("life-expenses.categoryBuckets");
        localStorage.removeItem("life-expenses.expenseCategories");
        localStorage.setItem("life-expenses.userProfile", JSON.stringify({ email: "uat@example.com", privateKey: "uat-key", identity: "uat@example.com::uat-key", label: "uat", userId: "user-uat" }));
        localStorage.setItem("life-expenses.ownerProfile", JSON.stringify({ email: "uat@example.com", privateKey: "uat-key", identity: "uat@example.com::uat-key", label: "uat", userId: "user-uat" }));
      } catch {}
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = typeof input === "string" ? input : input.url;
        if (url && url.includes("script.google.com/macros")) {
          const method = (init.method || "GET").toUpperCase();
          if (method === "GET") {
            return new Response(JSON.stringify(dashboard), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          let body = {};
          try { body = JSON.parse(init.body || "{}"); } catch {}
          window.__uatPosts.push(body);
          return new Response(JSON.stringify({ ok: true, action: body.action, categories: body.categories || [], accounts: body.accounts || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return nativeFetch(input, init);
      };
    })();
  `;
}

async function setNativeValue(cdp, selector, value) {
  await evalInPage(cdp, `
    (() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return input.value;
    })()
  `);
}

async function typeIntoFocusedInput(cdp, selector, value) {
  await evalInPage(cdp, `
    (() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!input) throw new Error("Input not found: " + ${JSON.stringify(selector)});
      input.focus();
      input.select();
    })()
  `);
  await cdp.send("Input.insertText", { text: value });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
}

async function waitForPageReady(cdp) {
  const start = Date.now();
  while (Date.now() - start < 12000) {
    const ready = await evalInPage(cdp, `
      (() => document.querySelectorAll(".entry-tab").length === 3
        && document.querySelectorAll(".journal-filters select").length >= 6
        && document.querySelectorAll(".planner-tab").length === 2)()
    `);
    if (ready) return;
    await wait(250);
  }
  throw new Error("App controls did not become ready");
}

async function navigateForDevice(cdp, device) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: device.width,
    height: device.height,
    deviceScaleFactor: device.dpr,
    mobile: device.mobile,
  });
  if (device.userAgent) {
    await cdp.send("Emulation.setUserAgentOverride", { userAgent: device.userAgent });
  }
  const load = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: `${appUrl}?uat=${device.name}-${Date.now()}` });
  await load;
  await wait(900);
}

async function scanLayout(cdp, device) {
  const data = await evalInPage(cdp, `
    (() => {
      const text = document.body.textContent;
      const selectors = [".journal-panel", ".dashboard-panel", ".entry-tabs", ".amount-field", ".note-field", ".category-grid", ".metric-grid", ".planning-console", ".analytics-grid", ".investment-summary", ".recent-list"];
      const rects = selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect();
        return { selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      const horizontalOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      const outOfBounds = rects.filter((rect) => !rect.missing && (rect.left < -2 || rect.right > window.innerWidth + 2));
      const recent = document.querySelector(".recent-list");
      const recentCollapsed = recent ? getComputedStyle(recent).display === "none" : false;
      const accountsText = [...document.querySelectorAll(".account-token")].map((item) => item.innerText);
      const actionRects = [...document.querySelectorAll(".dashboard-actions > *")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      const actionOverlap = actionRects.some((rect, index) =>
        actionRects.slice(index + 1).some((other) =>
          rect.left < other.right - 2 && rect.right > other.left + 2 && rect.top < other.bottom - 2 && rect.bottom > other.top + 2
        )
      );
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        horizontalOverflow,
        outOfBounds,
        missing: rects.filter((rect) => rect.missing).map((rect) => rect.selector),
        hasStep1: text.includes("Step 1"),
        hasFlow: /\\bFlow\\b/i.test(text),
        hasTabs: ["expenses", "income", "assets"].every((label) => text.toLowerCase().includes(label)),
        hasPeriods: ["weekly", "monthly", "yearly"].every((label) => text.toLowerCase().includes(label)),
        hasPlanner: ["budget", "recurring", "insights", "review"].every((label) => text.toLowerCase().includes(label)),
        hasPortfolioPulse: text.toLowerCase().includes("portfolio pulse"),
        recentRows: document.querySelectorAll(".recent-list .transaction-row").length,
        recentClientHeight: recent ? recent.clientHeight : 0,
        recentScrollHeight: recent ? recent.scrollHeight : 0,
        recentCollapsed,
        accountChipHasBalance: accountsText.some((value) => value.includes("₹")),
        actionOverlap,
        panelKicker: document.querySelector(".panel-kicker span")?.innerText || "",
        visibleButtons: document.querySelectorAll("button").length,
      };
    })()
  `);
  record(`${device.name}: required modules render`, data.missing.length === 0, JSON.stringify(data.missing));
  record(`${device.name}: no horizontal overflow`, data.horizontalOverflow <= 3 && data.outOfBounds.length === 0, JSON.stringify({ overflow: data.horizontalOverflow, outOfBounds: data.outOfBounds }));
  record(`${device.name}: Step/Flow removed`, !data.hasStep1 && !data.hasFlow, JSON.stringify({ hasStep1: data.hasStep1, hasFlow: data.hasFlow }));
  record(`${device.name}: tabs and period controls visible`, data.hasTabs && data.hasPeriods, "");
  record(`${device.name}: dashboard actions do not overlap`, !data.actionOverlap, "");
  record(`${device.name}: planning console tabs visible`, data.hasPlanner, "");
  record(`${device.name}: portfolio pulse present at BTF`, data.hasPortfolioPulse, "");
  record(`${device.name}: recent journal capped at 50`, data.recentRows === 50, String(data.recentRows));
  record(`${device.name}: recent journal scroll container active`, data.recentCollapsed || data.recentScrollHeight > data.recentClientHeight, JSON.stringify({ client: data.recentClientHeight, scroll: data.recentScrollHeight, collapsed: data.recentCollapsed }));
  record(`${device.name}: account chips hide balances`, !data.accountChipHasBalance, "");
  record(`${device.name}: header shows month only`, /^[A-Za-z]+ \d{4}$/.test(data.panelKicker), data.panelKicker);

  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(screenshotDir, `${device.name}.png`), Buffer.from(screenshot.data, "base64"));
}

async function runInteractionTests(cdp) {
  await navigateForDevice(cdp, devices[0]);
  await waitForPageReady(cdp);
  await evalInPage(cdp, `document.querySelector(".user-chip").click()`);
  await wait(150);
  await setNativeValue(cdp, ".user-gate input[type='email']", "uat@example.com");
  await setNativeValue(cdp, ".user-gate input[type='password']", "wrong-key");
  await evalInPage(cdp, `document.querySelector(".user-gate .submit-button").click()`);
  await wait(150);
  const wrongWorkspaceBlocked = await evalInPage(cdp, `Boolean(document.querySelector(".user-gate"))`);
  record("workspace gate blocks wrong private key", wrongWorkspaceBlocked, "");
  await setNativeValue(cdp, ".user-gate input[type='password']", "uat-key");
  await evalInPage(cdp, `document.querySelector(".user-gate .submit-button").click()`);
  await wait(250);
  const correctWorkspaceOpens = await evalInPage(cdp, `!document.querySelector(".user-gate") && document.querySelectorAll(".entry-tab").length === 3`);
  record("workspace gate accepts matching email and key", correctWorkspaceOpens, "");

  await evalInPage(cdp, `
    (() => {
      const tab = [...document.querySelectorAll(".entry-tab")].find((button) => button.innerText === "Expenses");
      if (tab) tab.click();
    })()
  `);
  await wait(150);

  const initial = await evalInPage(cdp, `
    (() => ({
      categoryTiles: document.querySelectorAll(".category-grid .category-token").length,
      categoryBars: document.querySelectorAll(".category-progress-line").length,
      deleteButtons: document.querySelectorAll(".category-grid .token-delete-button").length,
      dateField: Boolean(document.querySelector("input[aria-label='Entry date']")),
      noteField: Boolean(document.querySelector(".note-field input")),
      noteChips: document.querySelectorAll(".note-suggestions span").length,
      plannerTabs: document.querySelectorAll(".planner-tab").length,
      recentRows: document.querySelectorAll(".recent-list .transaction-row").length,
      postCount: window.__uatPosts.length,
    }))()
  `);
  record("desktop interactions: category controls present", initial.categoryTiles >= 9 && initial.deleteButtons === 0, JSON.stringify(initial));
  record("budget progress date and note controls present", initial.categoryBars >= 8 && initial.dateField && initial.noteField && initial.noteChips === 7 && initial.plannerTabs === 2, JSON.stringify(initial));
  record("desktop interactions: 50 recent rows rendered", initial.recentRows === 50, String(initial.recentRows));

  const notePromptVisible = await evalInPage(cdp, `
    (() => {
      const hint = document.querySelector(".note-suggestions span");
      return Boolean(hint) && getComputedStyle(document.querySelector(".note-suggestions")).pointerEvents === "none";
    })()
  `);
  await wait(100);
  const notePrompt = await evalInPage(cdp, `document.querySelector(".note-suggestions span")?.textContent.trim() === "order from food app"`);
  record("description prompt hints are decorative", notePromptVisible && notePrompt, JSON.stringify({ notePromptVisible, notePrompt }));

  await setNativeValue(cdp, ".amount-field input", "50+450");
  await evalInPage(cdp, `document.querySelector(".amount-calc-button")?.click()`);
  await wait(120);
  const amountCalculator = await evalInPage(cdp, `document.querySelector(".amount-field input")?.value === "500"`);
  record("amount field resolves inline calculation", amountCalculator, "");

  const journalFilterResult = await evalInPage(cdp, `
    (() => {
      const selects = document.querySelectorAll(".journal-filters select");
      if (selects.length < 6) {
        return {
          rowCount: 0,
          categoryMatch: false,
          weekMatch: false,
          spendMatch: false,
          spendText: "",
          hasNote: false,
          missingFilters: selects.length,
        };
      }
      selects[0].value = "Life Enjoyment";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
      selects[2].value = "1";
      selects[2].dispatchEvent(new Event("change", { bubbles: true }));
      selects[3].value = "101-1000";
      selects[3].dispatchEvent(new Event("change", { bubbles: true }));
      selects[4].value = "expense";
      selects[4].dispatchEvent(new Event("change", { bubbles: true }));
      selects[5].value = "with";
      selects[5].dispatchEvent(new Event("change", { bubbles: true }));
      return new Promise((resolve) => setTimeout(() => {
        const rows = [...document.querySelectorAll(".recent-list .transaction-row")];
        const text = rows.map((row) => row.innerText);
        resolve({
          rowCount: rows.length,
          categoryMatch: text.every((value) => value.includes("Life Enjoyment")),
          simplifiedRows: text.every((value) => !value.includes("W1") && !value.includes("Jun 2026") && !value.includes("HDFC Account") && !value.includes("Wants")),
          spendMatch: text.every((value) => /-₹[1-9][0-9]{2}\\b/.test(value)),
          spendText: document.querySelector(".journal-filter-head strong")?.innerText || "",
          hasNote: rows.length > 0 && document.querySelectorAll(".recent-list em").length === rows.length,
        });
      }, 80));
    })()
  `);
  record(
    "journal filters category week spend type and notes",
    journalFilterResult.rowCount > 0 && journalFilterResult.rowCount < 50 && journalFilterResult.categoryMatch && journalFilterResult.simplifiedRows && journalFilterResult.spendMatch && journalFilterResult.hasNote,
    JSON.stringify(journalFilterResult),
  );

  await evalInPage(cdp, `
    (() => {
      document.querySelectorAll(".journal-filters select").forEach((select) => {
        select.value = "all";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    })()
  `);
  await wait(150);

  await evalInPage(cdp, `
    (() => {
      if (!document.querySelector("input[aria-label='Monthly total budget']")) {
        document.querySelector(".command-heading").click();
      }
    })()
  `);
  await wait(150);
  await setNativeValue(cdp, "input[aria-label='Monthly total budget']", "65000");
  await wait(150);
  const budgetUpdated = await evalInPage(cdp, `
    (() => ({
      value: document.querySelector("input[aria-label='Monthly total budget']").value === "65000",
      posted: window.__uatPosts.some((post) => post.action === "saveBudgets" && post.budgets?.monthlyTotal === 65000),
    }))()
  `);
  record("monthly budget limit editable and synced", budgetUpdated.value && budgetUpdated.posted, JSON.stringify(budgetUpdated));

  await setNativeValue(cdp, ".budget-limit-line input", "0800");
  await wait(250);
  const categoryBudgetRollup = await evalInPage(cdp, `
    (() => {
      const categoryInputs = [...document.querySelectorAll(".budget-limit-line input")];
      const categoryTotal = categoryInputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
      const monthlyValue = Number(document.querySelector("input[aria-label='Monthly total budget']").value || 0);
      return {
        firstValue: categoryInputs[0]?.value || "",
        categoryTotal,
        monthlyValue,
        posted: window.__uatPosts.some((post) => post.action === "saveBudgets" && post.budgets?.monthlyTotal === categoryTotal),
      };
    })()
  `);
  record("category budgets roll up to monthly total without leading zero", categoryBudgetRollup.firstValue === "800" && categoryBudgetRollup.categoryTotal === categoryBudgetRollup.monthlyValue && categoryBudgetRollup.posted, JSON.stringify(categoryBudgetRollup));

  await setNativeValue(cdp, "input[aria-label='Needs allocation target']", "080");
  await wait(150);
  const splitBalanced = await evalInPage(cdp, `
    (() => {
      const values = ["Needs", "Wants", "Savings"].map((label) => Number(document.querySelector(\`input[aria-label='\${label} allocation target']\`)?.value || 0));
      return {
        values,
        sum: values.reduce((total, value) => total + value, 0),
        needsValue: document.querySelector("input[aria-label='Needs allocation target']")?.value || "",
      };
    })()
  `);
  record("allocation targets always rebalance to 100", splitBalanced.sum === 100 && splitBalanced.needsValue === "80", JSON.stringify(splitBalanced));

  await evalInPage(cdp, `
    (() => {
      const button = [...document.querySelectorAll(".recurring-command-card button")].find((item) => item.innerText.includes("Manage"));
      if (button) button.click();
    })()
  `);
  await wait(200);
  const recurringVisible = await evalInPage(cdp, `document.body.innerText.toLowerCase().includes("recurring") && document.querySelectorAll(".recurring-command-card .recurring-row").length >= 4`);
  record("recurring schedule command visible", recurringVisible, "");
  await evalInPage(cdp, `[...document.querySelectorAll(".recurring-command-card .mini-action-button")].find((button) => button.innerText.includes("Add")).click()`);
  await wait(150);
  const recurringSynced = await evalInPage(cdp, `window.__uatPosts.some((post) => post.action === "saveRecurring" && post.recurringRules?.length >= 5)`);
  record("recurring schedule command add syncs", recurringSynced, "");

  await evalInPage(cdp, `[...document.querySelectorAll(".planner-tab")].find((button) => button.innerText.includes("Insights")).click()`);
  await wait(200);
  const insightsVisible = await evalInPage(cdp, `document.body.innerText.toLowerCase().includes("forecast") && document.querySelectorAll(".insight-panel article").length >= 3`);
  record("forecast insights tab visible", insightsVisible, "");

  await evalInPage(cdp, `[...document.querySelectorAll(".planner-tab")].find((button) => button.innerText.includes("Review")).click()`);
  await wait(200);
  const reviewVisible = await evalInPage(cdp, `document.body.innerText.toLowerCase().includes("end-of-month review") && document.querySelectorAll(".review-grid div").length === 3`);
  record("end-of-month review tab visible", reviewVisible, "");

  await evalInPage(cdp, `document.querySelector(".category-grid .add-token").click()`);
  await setNativeValue(cdp, "input[aria-label='New expense category']", "UAT Category");
  await evalInPage(cdp, `document.querySelector("button[aria-label='Save category']").click()`);
  await wait(250);
  const addedCategory = await evalInPage(cdp, `
    (() => ({
      exists: [...document.querySelectorAll(".editable-display")].some((item) => item.textContent.trim() === "UAT Category"),
      posted: window.__uatPosts.some((post) => post.action === "saveCategories" && JSON.stringify(post).includes("UAT Category")),
    }))()
  `);
  record("category add persists via saveCategories", addedCategory.exists && addedCategory.posted, JSON.stringify(addedCategory));

  await evalInPage(cdp, `
    (() => {
      const editor = document.querySelector(".selected-flow-card .tap-edit-button");
      editor.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    })()
  `);
  await wait(250);
  await typeIntoFocusedInput(cdp, ".selected-flow-card .editable-text", "UAT Renamed");
  await wait(250);
  const renamedCategory = await evalInPage(cdp, `
    (() => ({
      exists: [...document.querySelectorAll(".editable-display")].some((item) => item.textContent.trim() === "UAT Renamed"),
      posted: window.__uatPosts.some((post) => post.action === "saveCategories" && JSON.stringify(post).includes("UAT Renamed")),
    }))()
  `);
  record("category rename reflects and saves", renamedCategory.exists && renamedCategory.posted, JSON.stringify(renamedCategory));

  await evalInPage(cdp, `document.querySelector(".undo-button").click()`);
  await wait(250);
  const undoCategory = await evalInPage(cdp, `[...document.querySelectorAll(".editable-display")].some((item) => item.textContent.trim() === "UAT Category")`);
  record("category rename undo restores category", undoCategory, "");

  await evalInPage(cdp, `document.querySelector(".selected-flow-card .back-chip").click()`);
  await wait(200);

  await evalInPage(cdp, `
    (() => {
      const token = [...document.querySelectorAll(".category-token")].find((item) => item.querySelector(".editable-display"));
      if (!token) throw new Error("No selectable category token found");
      token.click();
    })()
  `);
  await wait(250);
  const selectedCategory = await evalInPage(cdp, `
    (() => ({
      selectedCard: Boolean(document.querySelector(".selected-flow-card")),
      channelPanel: Boolean(document.querySelector(".channel-panel")),
      accountCount: document.querySelectorAll(".account-grid .account-token").length,
    }))()
  `);
  record("expense category selection reveals channel panel", selectedCategory.selectedCard && selectedCategory.channelPanel && selectedCategory.accountCount >= 6, JSON.stringify(selectedCategory));

  await evalInPage(cdp, `document.querySelector(".account-grid .add-token").click()`);
  await setNativeValue(cdp, "input[aria-label='New account']", "UAT Account");
  await evalInPage(cdp, `document.querySelector("button[aria-label='Save account']").click()`);
  await wait(250);
  const addedAccount = await evalInPage(cdp, `
    (() => ({
      exists: [...document.querySelectorAll(".account-token")].some((item) => item.innerText.includes("UAT Account")),
      posted: window.__uatPosts.some((post) => post.action === "saveAccounts" && JSON.stringify(post).includes("UAT Account")),
    }))()
  `);
  record("account add persists via saveAccounts", addedAccount.exists && addedAccount.posted, JSON.stringify(addedAccount));

  await evalInPage(cdp, `[...document.querySelectorAll(".detail-tab")].find((button) => button.innerText.includes("Accounts")).click()`);
  await wait(150);
  await evalInPage(cdp, `document.querySelector(".account-section-add").click()`);
  await setNativeValue(cdp, ".account-add-line input[aria-label='New account']", "Section Account");
  await evalInPage(cdp, `document.querySelector(".account-add-line button[aria-label='Save account']").click()`);
  await wait(250);
  const sectionAccountAdded = await evalInPage(cdp, `
    (() => ({
      exists: [...document.querySelectorAll(".account-line input")].some((item) => item.value.includes("Section Account")),
      posted: window.__uatPosts.some((post) => post.action === "saveAccounts" && JSON.stringify(post).includes("Section Account")),
    }))()
  `);
  record("account section add persists via saveAccounts", sectionAccountAdded.exists && sectionAccountAdded.posted, JSON.stringify(sectionAccountAdded));

  await evalInPage(cdp, `document.querySelector("input[aria-label='SBI Account balance']").focus()`);
  await setNativeValue(cdp, "input[aria-label='SBI Account balance']", "123456");
  await evalInPage(cdp, `document.querySelector("input[aria-label='SBI Account balance']").blur()`);
  await wait(250);
  const portfolioRollup = await evalInPage(cdp, `
    (() => {
      const accountInputs = [...document.querySelectorAll(".editable-account-line input[type='number']")];
      const accountTotal = accountInputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
      const portfolioTotal = Number((document.querySelector(".investment-copy strong")?.innerText || "").replace(/[^0-9]/g, ""));
      return {
        accountTotal,
        portfolioTotal,
        sbiValue: document.querySelector("input[aria-label='SBI Account balance']")?.value || "",
      };
    })()
  `);
  record("portfolio total equals account balances", portfolioRollup.accountTotal === portfolioRollup.portfolioTotal && portfolioRollup.sbiValue === "123456", JSON.stringify(portfolioRollup));

  await setNativeValue(cdp, ".amount-field input", "321");
  await setNativeValue(cdp, "input[aria-label='Entry date']", "2026-07-20");
  await setNativeValue(cdp, ".note-field input", "UAT expense note");
  await evalInPage(cdp, `document.querySelector(".submit-button").click()`);
  await wait(80);
  const expenseImmediate = await evalInPage(cdp, `
    (() => ({
      amountCleared: document.querySelector(".amount-field input").value === "",
      noteCleared: document.querySelector(".note-field input").value === "",
      buttonLoading: Boolean(document.querySelector(".submit-button .spin")),
      recentTop: document.querySelector(".recent-list .transaction-row")?.innerText || "",
    }))()
  `);
  record(
    "expense log appears instantly without blocking loader",
    expenseImmediate.amountCleared && expenseImmediate.noteCleared && !expenseImmediate.buttonLoading && expenseImmediate.recentTop.includes("UAT expense note"),
    JSON.stringify(expenseImmediate),
  );
  await wait(420);
  const expenseLogged = await evalInPage(cdp, `
    (() => ({
      posted: window.__uatPosts.some((post) => post.action === "addExpense" && Number(post.amount) === 321 && post.note === "UAT expense note"),
      postedUser: window.__uatPosts.find((post) => post.action === "addExpense" && Number(post.amount) === 321)?.userId || "",
      postedDate: window.__uatPosts.find((post) => post.action === "addExpense" && Number(post.amount) === 321)?.date || "",
      postedMonth: window.__uatPosts.find((post) => post.action === "addExpense" && Number(post.amount) === 321)?.monthString || "",
      amountCleared: document.querySelector(".amount-field input").value === "",
      dateReset: document.querySelector("input[aria-label='Entry date']").value !== "2026-07-20",
      noteCleared: document.querySelector(".note-field input").value === "",
      recentTop: document.querySelector(".recent-list .transaction-row")?.innerText || "",
    }))()
  `);
  record("expense log posts selected date user and clears fields", expenseLogged.posted && expenseLogged.postedUser === "user-uat" && expenseLogged.postedDate === "2026-07-20" && expenseLogged.postedMonth === "Jul 2026" && expenseLogged.amountCleared && expenseLogged.dateReset && expenseLogged.noteCleared, JSON.stringify(expenseLogged));

  await navigateForDevice(cdp, { ...devices[0], name: "desktop-refresh-after-expense" });
  await waitForPageReady(cdp);
  const refreshState = await evalInPage(cdp, `
    (() => {
      const body = document.body.innerText;
      const stored = JSON.parse(localStorage.getItem("life-expenses.transactions.user-uat") || "[]");
      return {
        bodyHasNote: body.includes("UAT expense note"),
        bodyHasAmount: body.includes("-₹321"),
        storedHasNote: stored.some((transaction) => transaction.note === "UAT expense note"),
        storedCount: stored.length,
        recentTop: document.querySelector(".recent-list .transaction-row")?.innerText || "",
      };
    })()
  `);
  record("expense log survives refresh via scoped local cache", refreshState.bodyHasNote && refreshState.bodyHasAmount && refreshState.storedHasNote, JSON.stringify(refreshState));

  await evalInPage(cdp, `document.querySelector(".entry-tab[aria-selected='false']").click()`);
  await wait(250);
  const incomeTab = await evalInPage(cdp, `
    (() => ({
      active: document.querySelector(".entry-tab[aria-selected='true']").innerText,
      receivedInto: document.body.innerText.toLowerCase().includes("received into"),
      sourceCount: document.querySelectorAll(".income-token").length,
    }))()
  `);
  record("income tab shows source and account flow", incomeTab.active === "Income" && incomeTab.receivedInto && incomeTab.sourceCount >= 8, JSON.stringify(incomeTab));

  await setNativeValue(cdp, ".amount-field input", "765");
  await evalInPage(cdp, `document.querySelector(".submit-button").click()`);
  await wait(500);
  const incomeLogged = await evalInPage(cdp, `window.__uatPosts.some((post) => post.action === "addIncome" && Number(post.amount) === 765)`);
  record("income log posts addIncome", incomeLogged, "");

  await evalInPage(cdp, `[...document.querySelectorAll(".entry-tab")].find((button) => button.innerText === "Assets").click()`);
  await wait(250);
  await setNativeValue(cdp, ".amount-field input", "999");
  await setNativeValue(cdp, "input[placeholder='SBI Account, Gold, Crypto...']", "UAT Asset");
  await evalInPage(cdp, `document.querySelector(".submit-button").click()`);
  await wait(500);
  const assetSaved = await evalInPage(cdp, `
    (() => ({
      updateAssetSource: window.__uatPosts.some((post) => post.action === "updateAssetSource" && JSON.stringify(post).includes("UAT Asset")),
      saveAccounts: window.__uatPosts.some((post) => post.action === "saveAccounts" && JSON.stringify(post).includes("UAT Asset")),
    }))()
  `);
  record("asset source posts and updates accounts", assetSaved.updateAssetSource && assetSaved.saveAccounts, JSON.stringify(assetSaved));

  await evalInPage(cdp, `document.querySelector(".sync-button").click()`);
  await wait(250);
  await setNativeValue(cdp, "input[value='126000']", "135000");
  await setNativeValue(cdp, "input[value='72500']", "75500");
  await evalInPage(cdp, `document.querySelector(".asset-sheet .submit-button").click()`);
  await wait(500);
  const assetSync = await evalInPage(cdp, `window.__uatPosts.some((post) => post.action === "updateGroww")`);
  record("portfolio asset sync posts updateGroww", assetSync, "");

  const weeklyBurn = await evalInPage(cdp, `
    (() => {
      const card = [...document.querySelectorAll(".metric-card")].find((item) => item.innerText.includes("Total Burn"));
      return Number((card?.querySelector("strong")?.innerText || "").replace(/[^0-9.]/g, ""));
    })()
  `);
  await evalInPage(cdp, `[...document.querySelectorAll(".period-tab")].find((button) => button.innerText === "Monthly").click()`);
  await wait(200);
  const monthly = await evalInPage(cdp, `
    (() => {
      const card = [...document.querySelectorAll(".metric-card")].find((item) => item.innerText.includes("Total Burn"));
      return {
        title: document.body.innerText.toLowerCase().includes("monthly burn profile"),
        burn: Number((card?.querySelector("strong")?.innerText || "").replace(/[^0-9.]/g, "")),
      };
    })()
  `);
  record("monthly tab updates graph title and burn scope", monthly.title && monthly.burn >= weeklyBurn && monthly.burn !== weeklyBurn, JSON.stringify({ weeklyBurn, monthly }));
  await evalInPage(cdp, `[...document.querySelectorAll(".period-tab")].find((button) => button.innerText === "Yearly").click()`);
  await wait(200);
  const yearly = await evalInPage(cdp, `
    (() => ({
      title: document.body.innerText.toLowerCase().includes("yearly burn profile"),
      headerYearOnly: /^\\d{4}$/.test(document.querySelector(".dashboard-header h2")?.innerText.trim() || ""),
      hasBudgetLeft: [...document.querySelectorAll(".metric-card span")].some((item) => item.innerText.includes("Budget Left")),
      splitWhole: /\\d+\\/\\d+\\/\\d+%/.test([...document.querySelectorAll(".metric-card strong")].at(-1)?.innerText || ""),
    }))()
  `);
  record("yearly tab updates graph and aggregate cards", yearly.title && yearly.headerYearOnly && yearly.hasBudgetLeft && yearly.splitWhole, JSON.stringify(yearly));
  await evalInPage(cdp, `document.querySelector(".chart-card .chart-expand-button").click()`);
  await wait(150);
  const graphReadout = await evalInPage(cdp, `
    (() => ({
      open: !!document.querySelector(".graph-detail-sheet"),
      target: document.body.innerText.toLowerCase().includes("target"),
      variance: /Over ₹|Behind ₹/.test(document.body.innerText),
    }))()
  `);
  record("graph expandable readout explains target and variance", graphReadout.open && graphReadout.target && graphReadout.variance, JSON.stringify(graphReadout));
  await evalInPage(cdp, `document.querySelector("button[aria-label='Close graph detail']").click()`);
  await wait(100);

  await evalInPage(cdp, `document.querySelector(".pie-card .chart-expand-button").click()`);
  await wait(150);
  const pieModal = await evalInPage(cdp, `
    (() => ({
      open: !!document.querySelector(".graph-detail-sheet"),
      title: document.body.innerText.toLowerCase().includes("spend details by category"),
      groups: document.querySelectorAll(".graph-detail-group").length,
      logs: document.querySelectorAll(".graph-log-row").length,
    }))()
  `);
  record("pie graph opens categorized spend modal", pieModal.open && pieModal.title && pieModal.groups > 0 && pieModal.logs > 0, JSON.stringify(pieModal));
  await evalInPage(cdp, `document.querySelector("button[aria-label='Close graph detail']").click()`);
  await wait(100);

  await evalInPage(cdp, `document.querySelector(".allocation-card .chart-expand-button").click()`);
  await wait(150);
  const allocationModal = await evalInPage(cdp, `
    (() => ({
      open: !!document.querySelector(".graph-detail-sheet"),
      title: document.body.innerText.toLowerCase().includes("allocation detail"),
      hasNeeds: document.body.innerText.includes("Needs"),
      logs: document.querySelectorAll(".graph-log-row").length,
    }))()
  `);
  record("allocation tracker opens bucket detail modal", allocationModal.open && allocationModal.title && allocationModal.hasNeeds && allocationModal.logs > 0, JSON.stringify(allocationModal));
  await evalInPage(cdp, `document.querySelector("button[aria-label='Close graph detail']").click()`);
  await wait(100);

  const simplifiedJournalRows = await evalInPage(cdp, `
    (() => {
      const rows = [...document.querySelectorAll(".recent-list .transaction-row")];
      const first = rows[0]?.innerText || "";
      return {
        rows: rows.length,
        deleteButtons: document.querySelectorAll(".recent-list .transaction-delete").length,
        first,
        hasOnlyCompactFields: !/\\bW\\d\\b|Jun 2026|SBI Account|HDFC Account|Needs|Wants|Savings/.test(first),
      };
    })()
  `);
  record(
    "journal rows only show category spend and description",
    simplifiedJournalRows.rows === 50 && simplifiedJournalRows.deleteButtons === 0 && simplifiedJournalRows.hasOnlyCompactFields,
    JSON.stringify(simplifiedJournalRows),
  );
}

async function runEdgeCaseTests(cdp) {
  await navigateForDevice(cdp, { ...devices[0], name: "edge-desktop" });
  await waitForPageReady(cdp);

  const startingPosts = await evalInPage(cdp, `window.__uatPosts.length`);
  await setNativeValue(cdp, ".amount-field input", "50/0");
  await wait(80);
  const invalidDivision = await evalInPage(cdp, `!document.querySelector(".amount-calc-button")`);
  await evalInPage(cdp, `document.querySelector(".submit-button").click()`);
  await wait(180);
  const noInvalidPost = await evalInPage(cdp, `window.__uatPosts.length === ${startingPosts}`);
  record("invalid arithmetic is blocked", invalidDivision && noInvalidPost, JSON.stringify({ invalidDivision, noInvalidPost }));

  await setNativeValue(cdp, ".amount-field input", "-25");
  await evalInPage(cdp, `document.querySelector(".submit-button").click()`);
  await wait(180);
  const noNegativePost = await evalInPage(cdp, `window.__uatPosts.length === ${startingPosts}`);
  record("negative amount is blocked", noNegativePost, "");

  await evalInPage(cdp, `document.querySelector(".category-grid .add-token").click()`);
  await setNativeValue(cdp, "input[aria-label='New expense category']", "Daily Essentials");
  await evalInPage(cdp, `document.querySelector("button[aria-label='Save category']").click()`);
  await wait(180);
  const duplicateCategory = await evalInPage(cdp, `
    (() => [...document.querySelectorAll(".editable-display")].filter((item) => item.textContent.trim() === "Daily Essentials").length)()
  `);
  record("duplicate category is not added", duplicateCategory === 1, String(duplicateCategory));

  const longCategoryName = "Very Long Custom Household Refill And Emergency Category Name";
  await evalInPage(cdp, `document.querySelector(".category-grid .add-token").click()`);
  await setNativeValue(cdp, "input[aria-label='New expense category']", longCategoryName);
  await evalInPage(cdp, `document.querySelector("button[aria-label='Save category']").click()`);
  await wait(250);
  const longCategoryLayout = await evalInPage(cdp, `
    (() => {
      const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      const tile = [...document.querySelectorAll(".category-token, .selected-flow-card")].find((item) => item.innerText.includes(${JSON.stringify(longCategoryName)}));
      const rect = tile?.getBoundingClientRect();
      return { exists: !!tile, overflow, right: rect?.right || 0, width: rect?.width || 0 };
    })()
  `);
  record("long custom category stays inside layout", longCategoryLayout.exists && longCategoryLayout.overflow <= 3 && longCategoryLayout.right <= 1442, JSON.stringify(longCategoryLayout));

  await evalInPage(cdp, `[...document.querySelectorAll(".period-tab")].find((button) => button.innerText === "Weekly").click()`);
  await wait(120);
  await evalInPage(cdp, `document.querySelector(".pie-card .chart-expand-button").click()`);
  await wait(150);
  const modalCloseByX = await evalInPage(cdp, `!!document.querySelector(".graph-detail-sheet")`);
  await evalInPage(cdp, `document.querySelector("button[aria-label='Close graph detail']").click()`);
  await wait(120);
  const modalClosed = await evalInPage(cdp, `!document.querySelector(".graph-detail-sheet")`);
  record("graph modal opens and closes cleanly", modalCloseByX && modalClosed, JSON.stringify({ modalCloseByX, modalClosed }));

  await evalInPage(cdp, `
    (() => {
      localStorage.setItem("life-expenses.budgets.user-uat", JSON.stringify({ monthlyTotal: 0, categories: {} }));
      localStorage.setItem("life-expenses.allocationTargets.user-uat", JSON.stringify({ needs: 0, wants: 0, savings: 0 }));
    })()
  `);
  await navigateForDevice(cdp, { ...devices[0], name: "edge-zero-budget" });
  await waitForPageReady(cdp);
  const zeroBudget = await evalInPage(cdp, `
    (() => {
      const text = document.body.innerText;
      return {
        noNaN: !/NaN|Infinity/.test(text),
        hasBudget: text.includes("Budget Left"),
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      };
    })()
  `);
  record("zero budget and zero split targets do not break UI", zeroBudget.noNaN && zeroBudget.hasBudget && zeroBudget.overflow <= 3, JSON.stringify(zeroBudget));

  await navigateForDevice(cdp, { ...devices[8], name: "edge-mobile-pages" });
  await waitForPageReady(cdp);
  const mobileInitial = await evalInPage(cdp, `
    (() => ({
      logVisible: getComputedStyle(document.querySelector(".journal-panel")).display !== "none",
      dashboardHidden: getComputedStyle(document.querySelector(".dashboard-panel")).display === "none",
      recentCollapsed: getComputedStyle(document.querySelector(".recent-list")).display === "none",
      navVisible: getComputedStyle(document.querySelector(".mobile-shell-nav")).display !== "none",
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    }))()
  `);
  record("mobile log page is primary and recent journal is collapsed", mobileInitial.logVisible && mobileInitial.dashboardHidden && mobileInitial.recentCollapsed && mobileInitial.navVisible && mobileInitial.overflow <= 3, JSON.stringify(mobileInitial));

  await evalInPage(cdp, `[...document.querySelectorAll(".mobile-shell-nav button")].find((button) => button.innerText.includes("Dashboard")).click()`);
  await wait(180);
  const mobileDashboard = await evalInPage(cdp, `
    (() => ({
      logHidden: getComputedStyle(document.querySelector(".journal-panel")).display === "none",
      dashboardVisible: getComputedStyle(document.querySelector(".dashboard-panel")).display !== "none",
      periodsVisible: getComputedStyle(document.querySelector(".period-tabs")).display !== "none",
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    }))()
  `);
  record("mobile dashboard page opens without overlap or overflow", mobileDashboard.logHidden && mobileDashboard.dashboardVisible && mobileDashboard.periodsVisible && mobileDashboard.overflow <= 3, JSON.stringify(mobileDashboard));

  await evalInPage(cdp, `[...document.querySelectorAll(".mobile-shell-nav button")].find((button) => button.innerText.includes("Log")).click()`);
  await wait(120);
  const mobileBackToLog = await evalInPage(cdp, `getComputedStyle(document.querySelector(".journal-panel")).display !== "none" && getComputedStyle(document.querySelector(".dashboard-panel")).display === "none"`);
  record("mobile bottom nav returns to log page", mobileBackToLog, "");

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await wait(150);
  const tinyAfterLongCategory = await evalInPage(cdp, `
    (() => {
      const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      const outOfBounds = [...document.querySelectorAll(".journal-panel, .dashboard-panel, .analytics-grid, .metric-grid")]
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.left < -2 || rect.right > window.innerWidth + 2);
      return { overflow, outOfBounds: outOfBounds.length };
    })()
  `);
  record("smallest mobile width stays horizontally contained", tinyAfterLongCategory.overflow <= 3 && tinyAfterLongCategory.outOfBounds === 0, JSON.stringify(tinyAfterLongCategory));
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const chrome = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profileDir}`,
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-dev-shm-usage",
    "about:blank",
  ], { stdio: "ignore" });

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const target = await fetch(`http://127.0.0.1:${port}/json/new`, { method: "PUT" }).then((response) => response.json());
    const cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: stubScript() });

    for (const device of devices) {
      await navigateForDevice(cdp, device);
      await scanLayout(cdp, device);
    }

    await runInteractionTests(cdp);
    await runEdgeCaseTests(cdp);
    cdp.close();
  } finally {
    chrome.kill();
    try {
      await wait(500);
      await rm(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
    } catch {
      // Chrome can hold Crashpad metrics briefly after shutdown; ignore cleanup noise.
    }
  }

  const failed = results.filter((item) => !item.pass);
  const summary = {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    screenshots: screenshotDir,
    failures: failed,
  };
  console.log(JSON.stringify({ summary, results }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
