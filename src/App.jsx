import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  IndianRupee,
  Landmark,
  Loader2,
  Plus,
  PiggyBank,
  RefreshCw,
  Repeat,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  ArrowRightLeft,
  X,
} from "lucide-react";

const RETIRED_APPS_SCRIPT_URLS = new Set([
  "https://script.google.com/macros/s/AKfycbxvo1s3og9yNuLT87blSI5AImLCF3iR9eGlaK7PV9nLCpIQoBGDsHfUUkJVHHk9XGjK/exec",
  "https://script.google.com/macros/s/AKfycbyDgeOF-PKedZGKIt-_s1YJkv4QAEfw8yS-_I8xRfx7dUq3dPl6vWwmKIwvdOMsvUeL2g/exec",
]);
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4-RINiUA3u4MLoep-t5gjl0mMKeh02gX4zLcIZ1KhMATzcf3XvqoMWJC7Cm5Guj-LIA/exec";
const CONFIGURED_APPS_SCRIPT_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || "").trim();
const APPS_SCRIPT_URL =
  CONFIGURED_APPS_SCRIPT_URL && !RETIRED_APPS_SCRIPT_URLS.has(CONFIGURED_APPS_SCRIPT_URL)
    ? CONFIGURED_APPS_SCRIPT_URL
    : DEFAULT_APPS_SCRIPT_URL;
const CONFIGURED_WORKSPACE_EMAIL = (import.meta.env.VITE_WORKSPACE_EMAIL || "").trim().toLowerCase();
const CONFIGURED_WORKSPACE_KEY = (import.meta.env.VITE_WORKSPACE_KEY || "").trim();
const CONFIGURED_WORKSPACE_USER_ID = (import.meta.env.VITE_WORKSPACE_USER_ID || "").trim();
const PRIMARY_WORKSPACE_EMAIL = "connect.sumitp@gmail.com";
const PRIMARY_WORKSPACE_KEY = "123";
const PRIMARY_WORKSPACE_USER_ID = "user-8eku3i";

const DEFAULT_CATEGORIES = [
  "Daily Essentials",
  "Life Enjoyment",
  "Commuting",
  "Home & Utilities",
  "Health & Fitness",
  "Personal Care",
  "Subscriptions",
  "Investments",
];

const DEFAULT_INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Stock Profit",
  "Mutual Fund Gain",
  "Interest",
  "Refund",
  "Gift",
  "Other Income",
];

const ENTRY_TABS = [
  { id: "expense", label: "Expenses" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfer" },
];

const PERIOD_TABS = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

const PLANNER_TABS = [
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "review", label: "Review", icon: ClipboardList },
];

const DEFAULT_ALLOCATION_TARGETS = {
  needs: 50,
  wants: 30,
  savings: 20,
};

const ALLOCATION_KEYS = ["needs", "wants", "savings"];

const JOURNAL_SPEND_FILTERS = [
  { id: "all", label: "All spends" },
  { id: "0-100", label: "₹0-100", min: 0, max: 100 },
  { id: "101-1000", label: "₹101-1000", min: 101, max: 1000 },
  { id: "1000+", label: "₹1000+", min: 1000 },
];

const NOTE_SUGGESTIONS = [
  "order from food app",
  "cab to office",
  "bedsheet for home",
  "gym membership",
  "moisturizer",
  "netflix subsciption",
  "Monthly SIP",
];

const CATEGORY_COLORS = {
  "Daily Essentials": "#C9B99E",
  "Life Enjoyment": "#B77954",
  Commuting: "#9A8C98",
  "Home & Utilities": "#4A5759",
  "Health & Fitness": "#E07A5F",
  "Personal Care": "#D4A373",
  Subscriptions: "#CA6702",
  Investments: "#6F8F78",
};

const MONTH_SHORT_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BUCKETS = {
  needs: ["Daily Essentials", "Commuting", "Home & Utilities", "Health & Fitness"],
  wants: ["Life Enjoyment", "Personal Care", "Subscriptions"],
  savings: ["Investments"],
};

const DEFAULT_ACCOUNTS = [
  { id: "sbi", name: "SBI Account", type: "Bank", balance: 42000 },
  { id: "hdfc", name: "HDFC Account", type: "Bank", balance: 28500 },
  { id: "cash", name: "Cash Reserve", type: "Cash", balance: 6800 },
  { id: "stocks", name: "Stocks", type: "Market", balance: 72500 },
  { id: "mutualFunds", name: "Mutual Funds", type: "Market", balance: 126000 },
];

const DEFAULT_BUDGETS = {
  monthlyTotal: 60000,
  categories: {
    "Daily Essentials": 12000,
    "Life Enjoyment": 8000,
    Commuting: 4500,
    "Home & Utilities": 14000,
    "Health & Fitness": 5000,
    "Personal Care": 3500,
    Subscriptions: 2500,
    Investments: 12000,
  },
};

const DEFAULT_RECURRING_RULES = [
  { id: "rent", name: "Rent", category: "Home & Utilities", amount: 18000, frequency: "monthly", dueDay: 5 },
  { id: "sip", name: "SIP", category: "Investments", amount: 5000, frequency: "monthly", dueDay: 1 },
  { id: "phone", name: "Phone bill", category: "Subscriptions", amount: 799, frequency: "monthly", dueDay: 12 },
  { id: "groceries", name: "Weekly essentials", category: "Daily Essentials", amount: 2500, frequency: "weekly", dueDay: 6 },
];

const STORAGE_KEYS = {
  accounts: "life-expenses.accounts",
  allocationTargets: "life-expenses.allocationTargets",
  bridgeVersion: "life-expenses.bridgeVersion",
  budgetSetupComplete: "life-expenses.budgetSetupComplete",
  budgets: "life-expenses.budgets",
  categoryBuckets: "life-expenses.categoryBuckets",
  expenseCategories: "life-expenses.expenseCategories",
  ownerProfile: "life-expenses.ownerProfile",
  recurringRules: "life-expenses.recurringRules",
  transactions: "life-expenses.transactions",
  userProfile: "life-expenses.userProfile",
};

const DEFAULT_WORKSPACE_ID = "default-user";
const BROWSER_STORAGE_VERSION = `bridge:${APPS_SCRIPT_URL || "demo"}:2026-06-clean-sheet-mobile-reset-v3`;

function resetStaleBridgeStorage() {
  if (typeof window === "undefined") return;
  try {
    const storedVersion = window.localStorage.getItem(STORAGE_KEYS.bridgeVersion);
    if (storedVersion === BROWSER_STORAGE_VERSION) return;
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("life-expenses.") && ![STORAGE_KEYS.bridgeVersion, STORAGE_KEYS.userProfile].includes(key))
      .forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(STORAGE_KEYS.bridgeVersion, BROWSER_STORAGE_VERSION);
  } catch {
    // Storage is best-effort; bridge reads remain the source of truth.
  }
}

function makeUserId(identity) {
  const source = String(identity || "").trim().toLowerCase();
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash) ^ source.charCodeAt(index);
  }
  return `user-${Math.abs(hash).toString(36)}`;
}

function normalizeUserProfile(profile) {
  const email = String(profile?.email || "").trim().toLowerCase();
  const privateKey = String(profile?.privateKey || "").trim();
  const identity = email && privateKey ? `${email}::${privateKey}` : "";
  if (!identity) return null;
  return {
    identity,
    email,
    privateKey,
    label: profile.label || email.split("@")[0] || "Personal workspace",
    userId: profile.userId || makeUserId(identity),
  };
}

function getConfiguredWorkspaceProfile() {
  if (!CONFIGURED_WORKSPACE_EMAIL || !CONFIGURED_WORKSPACE_KEY) return null;
  const profile = normalizeUserProfile({
    email: CONFIGURED_WORKSPACE_EMAIL,
    privateKey: CONFIGURED_WORKSPACE_KEY,
    label: CONFIGURED_WORKSPACE_EMAIL.split("@")[0] || "Workspace",
  });
  return CONFIGURED_WORKSPACE_USER_ID ? { ...profile, userId: CONFIGURED_WORKSPACE_USER_ID } : profile;
}

function getPrimaryWorkspaceProfile() {
  return normalizeUserProfile({
    email: PRIMARY_WORKSPACE_EMAIL,
    privateKey: PRIMARY_WORKSPACE_KEY,
    label: "connect",
    userId: PRIMARY_WORKSPACE_USER_ID,
  });
}

function profilesMatch(profile, ownerProfile) {
  return Boolean(profile?.identity && ownerProfile?.identity && profile.identity === ownerProfile.identity);
}

function getScopedStorageKey(key, userId) {
  return userId ? `${key}.${userId}` : key;
}

function getDateInputValue(date = new Date()) {
  const safeDate = new Date(date);
  if (Number.isNaN(safeDate.getTime())) return getDateInputValue(new Date());
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthInputValue(date = new Date()) {
  const safeDate = new Date(date);
  if (Number.isNaN(safeDate.getTime())) return getMonthInputValue(new Date());
  return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
}

function dateFromInputValue(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  const now = new Date();
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
}

function getMonthAnchorDate(value, fallbackDate = new Date()) {
  const fallback = new Date(fallbackDate);
  const safeFallback = Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  const [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month) return safeFallback;
  const currentMonthValue = getMonthInputValue(safeFallback);
  const anchorDay = value === currentMonthValue ? safeFallback.getDate() : new Date(year, month, 0).getDate();
  return new Date(year, month - 1, anchorDay, safeFallback.getHours(), safeFallback.getMinutes(), safeFallback.getSeconds(), safeFallback.getMilliseconds());
}

const DEMO_TRANSACTIONS = [
  makeEntry(1280, "Daily Essentials", "expense", "sbi", new Date(2026, 5, 1, 9, 18)),
  makeEntry(740, "Life Enjoyment", "expense", "hdfc", new Date(2026, 5, 3, 20, 4)),
  makeEntry(2100, "Investments", "expense", "mutualFunds", new Date(2026, 5, 6, 11, 24)),
  makeEntry(6500, "Stock Profit", "income", "stocks", new Date(2026, 5, 8, 11, 24)),
  makeEntry(560, "Commuting", "expense", "sbi", new Date(2026, 5, 10, 8, 2)),
  makeEntry(1890, "Home & Utilities", "expense", "hdfc", new Date(2026, 5, 16, 14, 35)),
  makeEntry(460, "Subscriptions", "expense", "sbi", new Date(2026, 5, 23, 7, 58)),
];

function getBucket(category) {
  const normalizedCategory = normalizeCategoryName(category);
  if (BUCKETS.needs.includes(normalizedCategory)) return "Needs";
  if (BUCKETS.wants.includes(normalizedCategory)) return "Wants";
  return "Savings";
}

function normalizeCategoryName(category) {
  return category === "Food Outside" ? "Life Enjoyment" : category;
}

function getIsoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
}

function getWeekOfMonth(date) {
  return Math.min(4, Math.ceil(date.getDate() / 7));
}

function makeEntry(amount, category, direction = "expense", accountId = "sbi", sourceDate = new Date(), note = "") {
  const date = new Date(sourceDate);
  const monthNumber = date.getMonth() + 1;
  const entryDate = date.toISOString().slice(0, 10);

  return {
    id: `${date.getTime()}-${Math.random().toString(16).slice(2)}`,
    amount: Number(amount),
    direction,
    category,
    accountId,
    bucket: direction === "expense" ? getBucket(category) : direction === "income" ? "Income" : "Transfer",
    timestamp: date.toISOString(),
    date: entryDate,
    dayString: date.toLocaleDateString("en-US", { weekday: "short" }),
    monthString: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    monthNumber,
    year: date.getFullYear(),
    weekNumber: getIsoWeek(date),
    weekOfMonth: getWeekOfMonth(date),
    note,
  };
}

function isBurnTransaction(transaction) {
  return transaction.direction === "expense" || (transaction.direction === "transfer" && transaction.countsTowardBurn === true);
}

function getBurnAmount(transaction) {
  const amount = Number(transaction.amount || 0);
  const burnAmount = transaction.direction === "transfer" ? Number(transaction.burnAmount ?? amount) : amount;
  return transaction.direction === "transfer" && Number(transaction.burnEffect || 1) < 0 ? -burnAmount : burnAmount;
}

function getSavingsBurnBasis(transactions, accountId) {
  return Math.max(
    0,
    transactions.reduce((basis, transaction) => {
      if (transaction.direction !== "transfer" || !transaction.countsTowardBurn || transaction.bucket !== "Savings") return basis;
      const burnAmount = Math.abs(getBurnAmount(transaction));
      if (Number(transaction.burnEffect || 1) > 0 && transaction.toAccountId === accountId) return basis + burnAmount;
      if (Number(transaction.burnEffect || 1) < 0 && transaction.fromAccountId === accountId) return basis - burnAmount;
      return basis;
    },
    0),
  );
}

function getSavingsTransferAmount(transaction) {
  if (transaction.direction !== "transfer" || transaction.countsAsSavings !== true) return 0;
  const amount = Number(transaction.savingsAmount ?? transaction.amount ?? 0);
  return Number(transaction.savingsEffect || 1) < 0 ? -amount : amount;
}

function getSavingsTransferBasis(transactions, accountId) {
  return Math.max(
    0,
    transactions.reduce((basis, transaction) => {
      if (transaction.direction !== "transfer" || transaction.countsAsSavings !== true) return basis;
      const savingsAmount = Math.abs(getSavingsTransferAmount(transaction));
      if (Number(transaction.savingsEffect || 1) > 0 && transaction.toAccountId === accountId) return basis + savingsAmount;
      if (Number(transaction.savingsEffect || 1) < 0 && transaction.fromAccountId === accountId) return basis - savingsAmount;
      return basis;
    }, 0),
  );
}

function toAllocationTransaction(transaction) {
  if (transaction.direction === "expense") return transaction;
  if (transaction.direction === "transfer" && transaction.countsAsSavings === true) {
    return { ...transaction, bucket: "Savings", category: transaction.category || "Investments", amount: getSavingsTransferAmount(transaction) };
  }
  return null;
}

function getBucketTotals(transactions) {
  const totals = transactions.reduce((memo, transaction) => {
    const key = String(transaction.bucket || getBucket(transaction.category)).toLowerCase();
    memo[key] = Number(memo[key] || 0) + Number(transaction.amount || 0);
    return memo;
  }, { needs: 0, wants: 0, savings: 0, transfer: 0 });
  Object.keys(totals).forEach((key) => {
    totals[key] = Math.max(0, totals[key]);
  });
  return totals;
}

async function apiGetDashboard(userId) {
  if (!APPS_SCRIPT_URL) return null;
  const url = new URL(APPS_SCRIPT_URL);
  if (userId) url.searchParams.set("userId", userId);
  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Dashboard read failed");
  const data = await response.json();
  if (data?.ok === false) throw new Error(data.error || "Dashboard read failed");
  return data;
}

async function apiPost(action, payload, userId) {
  if (!APPS_SCRIPT_URL) return null;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, userId, ...payload }),
  });
  if (!response.ok) throw new Error(`${action} write failed`);
  const data = await response.json();
  if (data?.ok === false) throw new Error(data.error || `${action} write failed`);
  return data;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function readStoredValue(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is a convenience layer; the app should keep running if storage is unavailable.
  }
}

function getTransactionUserId(userId) {
  return userId || DEFAULT_WORKSPACE_ID;
}

function readStoredTransactions(userId) {
  const transactions = readStoredValue(getScopedStorageKey(STORAGE_KEYS.transactions, getTransactionUserId(userId)), []);
  return Array.isArray(transactions) ? mergeTransactions(transactions, []) : [];
}

function writeStoredTransactions(userId, transactions) {
  writeStoredValue(getScopedStorageKey(STORAGE_KEYS.transactions, getTransactionUserId(userId)), mergeTransactions(transactions, []).slice(0, 250));
}

function getInitialUserProfile() {
  resetStaleBridgeStorage();
  const storedProfile = normalizeUserProfile(readStoredValue(STORAGE_KEYS.userProfile, null));
  if (!storedProfile) return null;
  const primaryProfile = getPrimaryWorkspaceProfile();
  if (profilesMatch(storedProfile, primaryProfile)) return primaryProfile;
  const configuredProfile = getConfiguredWorkspaceProfile();
  if (configuredProfile) return profilesMatch(storedProfile, configuredProfile) ? storedProfile : null;
  return storedProfile;
}

function useBridgeSource() {
  return Boolean(APPS_SCRIPT_URL);
}

function numericInputValue(value) {
  return Number(value || 0) === 0 ? "" : String(value);
}

function numericFieldFocus(event) {
  if (Number(event.currentTarget.value || 0) === 0) {
    event.currentTarget.value = "";
    return;
  }
  event.currentTarget.select();
}

function makeSlug(name, existingIds = []) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
  let id = base;
  let index = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function mergeAccounts(primaryAccounts, fallbackAccounts) {
  const ids = new Set(primaryAccounts.map((account) => account.id));
  return [...primaryAccounts, ...fallbackAccounts.filter((account) => !ids.has(account.id))];
}

function mergeTransactions(primaryTransactions = [], fallbackTransactions = []) {
  const ids = new Set(primaryTransactions.map((transaction) => transaction.id));
  return [...primaryTransactions, ...fallbackTransactions.filter((transaction) => transaction?.id && !ids.has(transaction.id))].sort((a, b) => {
    const aTime = new Date(a.timestamp || a.date || 0).getTime();
    const bTime = new Date(b.timestamp || b.date || 0).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return [...new Set(categories
    .map((category) => normalizeCategoryName(typeof category === "string" ? category : category.name))
    .filter(Boolean))];
}

function normalizeCategoryBuckets(categories, buckets = {}) {
  return Object.fromEntries(
    categories.map((name) => {
      const bucket = typeof buckets[name] === "string" ? buckets[name] : getBucket(name);
      return [name, bucket];
    }),
  );
}

function getDefaultCategoryBudget(categoryName) {
  const bucket = getBucket(categoryName);
  if (DEFAULT_BUDGETS.categories[categoryName]) return DEFAULT_BUDGETS.categories[categoryName];
  if (bucket === "Needs") return 6000;
  if (bucket === "Wants") return 3500;
  return 8000;
}

function normalizeBudgets(categories, storedBudgets = DEFAULT_BUDGETS) {
  const storedCategories = storedBudgets?.categories || {};
  return {
    monthlyTotal: Number(storedBudgets?.monthlyTotal || DEFAULT_BUDGETS.monthlyTotal),
    categories: Object.fromEntries(
      categories.map((name) => [name, Number(storedCategories[name] ?? getDefaultCategoryBudget(name))]),
    ),
  };
}

function normalizeAllocationTargets(storedTargets = DEFAULT_ALLOCATION_TARGETS) {
  const rawTargets = {
    needs: Math.max(0, Math.min(100, Number(storedTargets?.needs ?? DEFAULT_ALLOCATION_TARGETS.needs))),
    wants: Math.max(0, Math.min(100, Number(storedTargets?.wants ?? DEFAULT_ALLOCATION_TARGETS.wants))),
    savings: Math.max(0, Math.min(100, Number(storedTargets?.savings ?? DEFAULT_ALLOCATION_TARGETS.savings))),
  };
  const total = ALLOCATION_KEYS.reduce((sum, key) => sum + rawTargets[key], 0);
  if (total === 100) return rawTargets;
  if (total <= 0) return DEFAULT_ALLOCATION_TARGETS;
  const needs = Math.round((rawTargets.needs / total) * 100);
  const wants = Math.round((rawTargets.wants / total) * 100);
  return {
    needs,
    wants,
    savings: Math.max(0, 100 - needs - wants),
  };
}

function rebalanceAllocationTarget(targets, bucketName, nextValue) {
  const selectedValue = Math.max(0, Math.min(100, Number(nextValue || 0)));
  const otherKeys = ALLOCATION_KEYS.filter((key) => key !== bucketName);
  const remaining = 100 - selectedValue;
  const firstOther = Math.floor(remaining / 2);
  return {
    ...targets,
    [bucketName]: selectedValue,
    [otherKeys[0]]: firstOther,
    [otherKeys[1]]: remaining - firstOther,
  };
}

function getDefaultAllocationAnchor(bucketName) {
  if (bucketName === "savings") return "wants";
  return "savings";
}

function rebalanceAllocationTargetWithAnchor(targets, bucketName, nextValue, anchorKey) {
  const selectedValue = Math.max(0, Math.min(100, Number(nextValue || 0)));
  const otherKeys = ALLOCATION_KEYS.filter((key) => key !== bucketName);
  const safeAnchor = otherKeys.includes(anchorKey) ? anchorKey : getDefaultAllocationAnchor(bucketName);
  const anchoredKey = otherKeys.includes(safeAnchor) ? safeAnchor : otherKeys[0];
  const remainderKey = otherKeys.find((key) => key !== anchoredKey);
  const remaining = 100 - selectedValue;
  const preferredAnchorValue =
    anchorKey && otherKeys.includes(anchorKey)
      ? Number(targets[anchoredKey] ?? DEFAULT_ALLOCATION_TARGETS[anchoredKey])
      : Number(DEFAULT_ALLOCATION_TARGETS[anchoredKey]);
  const anchoredValue = Math.max(0, Math.min(remaining, preferredAnchorValue));

  return {
    ...targets,
    [bucketName]: selectedValue,
    [anchoredKey]: anchoredValue,
    [remainderKey]: remaining - anchoredValue,
  };
}

function normalizeRecurringRules(rules, categories) {
  const categoryFallback = categories[0] || DEFAULT_CATEGORIES[0];
  return (Array.isArray(rules) ? rules : DEFAULT_RECURRING_RULES).map((rule, index) => ({
    id: rule.id || `recurring-${index}`,
    name: rule.name || "Recurring item",
    category: categories.includes(rule.category) ? rule.category : categoryFallback,
    amount: Number(rule.amount || 0),
    frequency: rule.frequency === "weekly" ? "weekly" : "monthly",
    dueDay: Number(rule.dueDay || 1),
  }));
}

function normalizeDashboardTransactions(transactions) {
  const seen = new Set();
  return (Array.isArray(transactions) ? transactions : [])
    .map((transaction, index) => {
      const category = normalizeCategoryName(transaction.category);
      const stableId =
        transaction.id ||
        [
          transaction.timestamp,
          transaction.date,
          transaction.direction,
          category,
          transaction.amount,
          transaction.accountId,
          transaction.note,
          index,
        ]
          .filter((part) => part !== undefined && part !== null)
          .join("|");
      return {
        ...transaction,
        id: stableId,
        category,
        bucket:
          transaction.direction === "income"
            ? "Income"
            : transaction.direction === "transfer"
              ? transaction.bucket || "Transfer"
              : getBucket(category),
      };
    })
    .filter((transaction) => {
      if (!transaction.id || seen.has(transaction.id)) return false;
      seen.add(transaction.id);
      return true;
    });
}

function findLocalOnlyTransactions(remoteTransactions = [], localTransactions = []) {
  const remoteIds = new Set(remoteTransactions.map((transaction) => transaction.id).filter(Boolean));
  return localTransactions.filter((transaction) => transaction?.id && !remoteIds.has(transaction.id));
}

function getNextDueDate(rule, anchorDate = new Date()) {
  const today = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  if (rule.frequency === "weekly") {
    const targetDay = Math.max(0, Math.min(6, Number(rule.dueDay || 0)));
    const currentDay = today.getDay();
    const offset = (targetDay - currentDay + 7) % 7;
    const due = new Date(today);
    due.setDate(today.getDate() + offset);
    return due;
  }

  const day = Math.max(1, Math.min(31, Number(rule.dueDay || 1)));
  const due = new Date(today.getFullYear(), today.getMonth(), day);
  if (due < today) due.setMonth(due.getMonth() + 1);
  return due;
}

function getDaysUntil(date, anchorDate = new Date()) {
  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.round((end - start) / 86400000));
}

function evaluateAmountExpression(expression) {
  const source = String(expression || "").replace(/,/g, "").trim();
  if (!source) return null;
  if (!/^[\d+\-*/().\s]+$/.test(source)) return null;
  if (!/[+\-*/]/.test(source)) {
    const value = Number(source);
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  try {
    // The expression is restricted above to numbers and arithmetic operators.
    const value = Function(`"use strict"; return (${source});`)();
    return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  } catch {
    return null;
  }
}

function App() {
  const [userProfile, setUserProfile] = useState(() => getInitialUserProfile());
  const [userEmailDraft, setUserEmailDraft] = useState(() => userProfile?.email || "");
  const [userKeyDraft, setUserKeyDraft] = useState(() => userProfile?.privateKey || "");
  const activeUserId = userProfile?.userId || "";
  const [entryMode, setEntryMode] = useState("expense");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(() => getDateInputValue());
  const [graphModal, setGraphModal] = useState(null);
  const [mobilePage, setMobilePage] = useState("log");
  const [mobileJournalOpen, setMobileJournalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [expenseCategories, setExpenseCategories] = useState(() => (useBridgeSource() ? DEFAULT_CATEGORIES : readStoredValue(getScopedStorageKey(STORAGE_KEYS.expenseCategories, activeUserId), DEFAULT_CATEGORIES)));
  const [categoryBuckets, setCategoryBuckets] = useState(() =>
    useBridgeSource()
      ? Object.fromEntries(DEFAULT_CATEGORIES.map((item) => [item, getBucket(item)]))
      : readStoredValue(getScopedStorageKey(STORAGE_KEYS.categoryBuckets, activeUserId), Object.fromEntries(DEFAULT_CATEGORIES.map((item) => [item, getBucket(item)]))),
  );
  const [incomeSources, setIncomeSources] = useState(DEFAULT_INCOME_SOURCES);
  const [category, setCategory] = useState("");
  const [incomeSource, setIncomeSource] = useState(DEFAULT_INCOME_SOURCES[0]);
  const [selectedAccount, setSelectedAccount] = useState(DEFAULT_ACCOUNTS[0].id);
  const [transferFromAccount, setTransferFromAccount] = useState(DEFAULT_ACCOUNTS[0].id);
  const [transferToAccount, setTransferToAccount] = useState(DEFAULT_ACCOUNTS[1].id);
  const [transferCountsAsSavings, setTransferCountsAsSavings] = useState(false);
  const [transferCountsTowardBurn, setTransferCountsTowardBurn] = useState(false);
  const [accounts, setAccounts] = useState(() => normalizeAccounts(useBridgeSource() ? DEFAULT_ACCOUNTS : readStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, activeUserId), DEFAULT_ACCOUNTS)));
  const [detailTab, setDetailTab] = useState("accounts");
  const [periodTab, setPeriodTab] = useState("monthly");
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState(() => getMonthInputValue());
  const [plannerTab, setPlannerTab] = useState("insights");
  const [journalCategory, setJournalCategory] = useState("all");
  const [journalMonth, setJournalMonth] = useState("all");
  const [journalWeek, setJournalWeek] = useState("all");
  const [journalSpend, setJournalSpend] = useState("all");
  const [journalDirection, setJournalDirection] = useState("all");
  const [journalNoteMode, setJournalNoteMode] = useState("all");
  const [transactions, setTransactions] = useState(() => {
    if (!activeUserId) return useBridgeSource() ? [] : DEMO_TRANSACTIONS;
    if (useBridgeSource()) return [];
    return readStoredTransactions(activeUserId);
  });
  const [assets, setAssets] = useState({ mutualFunds: 126000, stocks: 72500 });
  const [allocationTargets, setAllocationTargets] = useState(() => normalizeAllocationTargets(useBridgeSource() ? DEFAULT_ALLOCATION_TARGETS : readStoredValue(getScopedStorageKey(STORAGE_KEYS.allocationTargets, activeUserId), DEFAULT_ALLOCATION_TARGETS)));
  const [budgets, setBudgets] = useState(() => normalizeBudgets(expenseCategories, useBridgeSource() ? DEFAULT_BUDGETS : readStoredValue(getScopedStorageKey(STORAGE_KEYS.budgets, activeUserId), DEFAULT_BUDGETS)));
  const [budgetSetupComplete, setBudgetSetupComplete] = useState(() => (useBridgeSource() ? false : readStoredValue(getScopedStorageKey(STORAGE_KEYS.budgetSetupComplete, activeUserId), false)));
  const [budgetSetupOpen, setBudgetSetupOpen] = useState(() => (useBridgeSource() ? true : !readStoredValue(getScopedStorageKey(STORAGE_KEYS.budgetSetupComplete, activeUserId), false)));
  const [recurringRules, setRecurringRules] = useState(() =>
    normalizeRecurringRules(useBridgeSource() ? DEFAULT_RECURRING_RULES : readStoredValue(getScopedStorageKey(STORAGE_KEYS.recurringRules, activeUserId), DEFAULT_RECURRING_RULES), expenseCategories),
  );
  const [recurringSetupOpen, setRecurringSetupOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [draftAssets, setDraftAssets] = useState(assets);
  const [remoteMetrics, setRemoteMetrics] = useState(null);
  const [ripples, setRipples] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [status, setStatus] = useState(APPS_SCRIPT_URL ? "Bridge ready" : "Demo mode");
  const [hydrating, setHydrating] = useState(Boolean(APPS_SCRIPT_URL && activeUserId));
  const [busy, setBusy] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryDraft, setNewCategoryDraft] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountDraft, setNewAccountDraft] = useState("");
  const [newAccountType, setNewAccountType] = useState("Bank");
  const dashboardMonthTouchedRef = useRef(false);
  const allocationEditRef = useRef(null);
  const allocationLastEditedRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function hydrate() {
      if (!APPS_SCRIPT_URL || !activeUserId) return;
      setHydrating(true);
      try {
        const data = await apiGetDashboard(activeUserId);
        if (!alive || !data) return;
        const nextCategories = Array.isArray(data.categories) && data.categories.length ? normalizeCategories(data.categories) : DEFAULT_CATEGORIES;
        const remoteTransactions = Array.isArray(data.transactions) ? normalizeDashboardTransactions(data.transactions) : [];
        setTransactions(remoteTransactions);
        writeStoredTransactions(activeUserId, remoteTransactions);
        setExpenseCategories(nextCategories);
        setCategoryBuckets(normalizeCategoryBuckets(nextCategories, data.categoryBuckets));
        setBudgets(normalizeBudgets(nextCategories, data.budgets || DEFAULT_BUDGETS));
        setBudgetSetupComplete(Boolean(data.budgets));
        setBudgetSetupOpen(!data.budgets);
        setAllocationTargets(normalizeAllocationTargets(data.allocationTargets || DEFAULT_ALLOCATION_TARGETS));
        setRecurringRules(normalizeRecurringRules(Array.isArray(data.recurringRules) ? data.recurringRules : DEFAULT_RECURRING_RULES, nextCategories));
        setAccounts(normalizeAccounts(Array.isArray(data.accounts) && data.accounts.length ? data.accounts : DEFAULT_ACCOUNTS));
        if (data.assets) setAssets(normalizeAssets(data.assets));
        if (data.cells) {
          setAssets({
            mutualFunds: Number(data.cells.C16 || 0),
            stocks: Number(data.cells.C17 || 0),
          });
        }
        if (data.stocksVal || data.mfVal || data.stocks || data.mf) {
          setAssets(normalizeAssets(data));
        }
        const metrics = normalizeMetrics(data);
        if (metrics) setRemoteMetrics(metrics);
        setStatus("Updated");
      } catch {
        if (alive) setStatus("Bridge unavailable");
      } finally {
        if (alive) setHydrating(false);
      }
    }
    hydrate();
    return () => {
      alive = false;
    };
  }, [activeUserId]);

  useEffect(() => {
    if (!userProfile) return;
    writeStoredValue(STORAGE_KEYS.userProfile, userProfile);
    if (useBridgeSource()) {
      setHydrating(true);
      setTransactions([]);
      setExpenseCategories(DEFAULT_CATEGORIES);
      setCategoryBuckets(Object.fromEntries(DEFAULT_CATEGORIES.map((item) => [item, getBucket(item)])));
      setAccounts(normalizeAccounts(DEFAULT_ACCOUNTS));
      setBudgets(normalizeBudgets(DEFAULT_CATEGORIES, DEFAULT_BUDGETS));
      setBudgetSetupComplete(false);
      setBudgetSetupOpen(true);
      setAllocationTargets(normalizeAllocationTargets(DEFAULT_ALLOCATION_TARGETS));
      setRecurringRules(normalizeRecurringRules(DEFAULT_RECURRING_RULES, DEFAULT_CATEGORIES));
    } else {
      const nextCategories = readStoredValue(getScopedStorageKey(STORAGE_KEYS.expenseCategories, userProfile.userId), DEFAULT_CATEGORIES);
      setTransactions(readStoredTransactions(userProfile.userId));
      setExpenseCategories(nextCategories);
      setCategoryBuckets(readStoredValue(getScopedStorageKey(STORAGE_KEYS.categoryBuckets, userProfile.userId), Object.fromEntries(nextCategories.map((item) => [item, getBucket(item)]))));
      setAccounts(normalizeAccounts(readStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, userProfile.userId), DEFAULT_ACCOUNTS)));
      setBudgets(normalizeBudgets(nextCategories, readStoredValue(getScopedStorageKey(STORAGE_KEYS.budgets, userProfile.userId), DEFAULT_BUDGETS)));
      setBudgetSetupComplete(readStoredValue(getScopedStorageKey(STORAGE_KEYS.budgetSetupComplete, userProfile.userId), false));
      setBudgetSetupOpen(!readStoredValue(getScopedStorageKey(STORAGE_KEYS.budgetSetupComplete, userProfile.userId), false));
      setAllocationTargets(normalizeAllocationTargets(readStoredValue(getScopedStorageKey(STORAGE_KEYS.allocationTargets, userProfile.userId), DEFAULT_ALLOCATION_TARGETS)));
      setRecurringRules(normalizeRecurringRules(readStoredValue(getScopedStorageKey(STORAGE_KEYS.recurringRules, userProfile.userId), DEFAULT_RECURRING_RULES), nextCategories));
    }
    setCategory("");
    setSelectedAccount(DEFAULT_ACCOUNTS[0].id);
  }, [userProfile?.userId]);

  useEffect(() => {
    setDraftAssets(assets);
  }, [assets]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.expenseCategories, activeUserId), expenseCategories);
  }, [expenseCategories, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.categoryBuckets, activeUserId), categoryBuckets);
  }, [categoryBuckets, activeUserId]);

  useEffect(() => {
    setBudgets((current) => normalizeBudgets(expenseCategories, current));
    setRecurringRules((current) => normalizeRecurringRules(current, expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.budgets, activeUserId), budgets);
  }, [budgets, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.budgetSetupComplete, activeUserId), budgetSetupComplete);
  }, [budgetSetupComplete, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.allocationTargets, activeUserId), allocationTargets);
  }, [allocationTargets, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.recurringRules, activeUserId), recurringRules);
  }, [recurringRules, activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, activeUserId), accounts);
  }, [accounts, activeUserId]);

  useEffect(() => {
    if (!accounts.length) return;
    const ids = new Set(accounts.map((account) => account.id));
    if (!ids.has(transferFromAccount)) setTransferFromAccount(accounts[0].id);
    if (!ids.has(transferToAccount) || transferToAccount === transferFromAccount) {
      setTransferToAccount(accounts.find((account) => account.id !== transferFromAccount)?.id || accounts[0].id);
    }
  }, [accounts, transferFromAccount, transferToAccount]);

  useEffect(() => {
    if (!activeUserId) return;
    writeStoredTransactions(activeUserId, transactions);
  }, [transactions, activeUserId]);

  useEffect(() => {
    if (dashboardMonthTouchedRef.current || !transactions.length) return;
    const latestMonth = transactions
      .map((transaction) => getJournalMonthValue(transaction))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0];
    if (latestMonth) setSelectedDashboardMonth(latestMonth);
  }, [transactions]);

  const analyticsAnchorDate = useMemo(
    () => (periodTab === "monthly" ? getMonthAnchorDate(selectedDashboardMonth) : new Date()),
    [periodTab, selectedDashboardMonth],
  );
  const analytics = useMemo(
    () => buildAnalytics(transactions, accounts, assets, remoteMetrics, periodTab, expenseCategories, budgets, recurringRules, allocationTargets, analyticsAnchorDate),
    [transactions, accounts, assets, remoteMetrics, periodTab, expenseCategories, budgets, recurringRules, allocationTargets, analyticsAnchorDate],
  );
  const activeGraphDetail = useMemo(() => getGraphDetailConfig(graphModal, analytics, periodTab), [graphModal, analytics, periodTab]);
  const categoryProgressByName = Object.fromEntries(analytics.categoryProgress.map((item) => [item.name, item]));
  const incomeEntries = useMemo(() => transactions.filter((transaction) => transaction.direction === "income"), [transactions]);
  const journalOptions = useMemo(() => buildJournalOptions(transactions, expenseCategories, incomeSources), [transactions, expenseCategories, incomeSources]);
  const dashboardMonthOptions = useMemo(() => buildDashboardMonthOptions(transactions), [transactions]);
  const filteredJournalEntries = useMemo(
    () => filterJournalEntries(transactions, {
      category: journalCategory,
      direction: journalDirection,
      month: journalMonth,
      noteMode: journalNoteMode,
      spend: journalSpend,
      week: journalWeek,
    }),
    [transactions, journalCategory, journalDirection, journalMonth, journalNoteMode, journalSpend, journalWeek],
  );
  const journalSpendTotal = useMemo(
    () =>
      filteredJournalEntries
        .filter(isBurnTransaction)
        .reduce((sum, transaction) => sum + getBurnAmount(transaction), 0),
    [filteredJournalEntries],
  );
  const selectedAccountLabel = accounts.find((account) => account.id === selectedAccount)?.name || "Account";
  const transferFrom = accounts.find((account) => account.id === transferFromAccount);
  const transferTo = accounts.find((account) => account.id === transferToAccount);
  const isTransferSavingsReversal = transferCountsAsSavings && transferFrom?.type === "Market" && transferTo?.type !== "Market";
  const transferBurnBasis = transferFrom ? getSavingsBurnBasis(transactions, transferFrom.id) : 0;
  const activeCategory = entryMode === "income" ? "Income" : category;
  const activeBucket = categoryBuckets[category] || getBucket(category);
  const canChooseChannel = entryMode !== "expense" || Boolean(category);
  const calculatedAmount = evaluateAmountExpression(amount);
  const amountNeedsCalculation = /[+\-*/]/.test(String(amount)) && calculatedAmount !== null;
  const budgetProgressPercent = budgets.monthlyTotal ? Math.min(100, Math.round((analytics.monthlyBudgetSpent / budgets.monthlyTotal) * 100)) : 0;
  const budgetPulseTone = analytics.overspend > 0 ? "danger" : budgetProgressPercent >= 82 ? "warn" : "calm";
  const allocationTargetTotal = allocationTargets.needs + allocationTargets.wants + allocationTargets.savings;
  const nextRecurringItem = analytics.nextRecurring[0];

  function applyDashboardData(data) {
    if (!data) return;
    const nextCategories = Array.isArray(data.categories) && data.categories.length ? normalizeCategories(data.categories) : DEFAULT_CATEGORIES;
    const remoteTransactions = Array.isArray(data.transactions) ? normalizeDashboardTransactions(data.transactions) : [];
    setTransactions(remoteTransactions);
    if (activeUserId) writeStoredTransactions(activeUserId, remoteTransactions);
    setExpenseCategories(nextCategories);
    setCategoryBuckets(normalizeCategoryBuckets(nextCategories, data.categoryBuckets));
    setBudgets(normalizeBudgets(nextCategories, data.budgets || DEFAULT_BUDGETS));
    setBudgetSetupComplete(Boolean(data.budgets));
    setBudgetSetupOpen(!data.budgets);
    setAllocationTargets(normalizeAllocationTargets(data.allocationTargets || DEFAULT_ALLOCATION_TARGETS));
    setRecurringRules(normalizeRecurringRules(Array.isArray(data.recurringRules) ? data.recurringRules : DEFAULT_RECURRING_RULES, nextCategories));
    setAccounts(normalizeAccounts(Array.isArray(data.accounts) && data.accounts.length ? data.accounts : DEFAULT_ACCOUNTS));
    if (data.assets) setAssets(normalizeAssets(data.assets));
    if (data.cells) {
      setAssets({
        mutualFunds: Number(data.cells.C16 || 0),
        stocks: Number(data.cells.C17 || 0),
      });
    }
    if (data.stocksVal || data.mfVal || data.stocks || data.mf) {
      setAssets(normalizeAssets(data));
    }
    const metrics = normalizeMetrics(data);
    if (metrics) setRemoteMetrics(metrics);
  }

  async function syncDashboard(silent = true) {
    if (!APPS_SCRIPT_URL || !activeUserId) return;
    try {
      const data = await apiGetDashboard(activeUserId);
      applyDashboardData(data);
      if (!silent) setStatus("Updated");
    } catch {
      if (!silent) setStatus("Bridge unavailable");
    }
  }

  async function syncLocalTransactionsToBridge(localOnlyTransactions) {
    if (!APPS_SCRIPT_URL || !activeUserId || !localOnlyTransactions.length) return;
    try {
      await Promise.all(
        localOnlyTransactions.map((transaction) =>
          apiPost(transaction.direction === "income" ? "addIncome" : transaction.direction === "transfer" ? "addTransfer" : "addExpense", {
            ...transaction,
            type: transaction.bucket,
            source: transaction.source || transaction.category,
            account: transaction.account || getAccountName(accounts, transaction.accountId),
            accountId: transaction.accountId,
            accounts,
          }, activeUserId),
        ),
      );
      setStatus(`Synced ${localOnlyTransactions.length} cached ${localOnlyTransactions.length === 1 ? "entry" : "entries"}`);
    } catch {
      setStatus("Cached entries saved locally, bridge failed");
    }
  }

  async function saveCategoriesToBridge(nextCategories, nextBuckets) {
    if (activeUserId) {
      writeStoredValue(getScopedStorageKey(STORAGE_KEYS.expenseCategories, activeUserId), nextCategories);
      writeStoredValue(getScopedStorageKey(STORAGE_KEYS.categoryBuckets, activeUserId), nextBuckets);
    }
    if (!APPS_SCRIPT_URL) return;
    try {
      await apiPost("saveCategories", {
        categories: nextCategories.map((name) => ({
          name,
          bucket: nextBuckets[name] || getBucket(name),
        })),
        categoryBuckets: nextBuckets,
      }, activeUserId);
      setStatus("Categories synced");
    } catch {
      setStatus("Categories saved locally, bridge failed");
    }
  }

  async function saveAccountsToBridge(nextAccounts) {
    if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, activeUserId), nextAccounts);
    if (!APPS_SCRIPT_URL) return;
    try {
      await apiPost("saveAccounts", { accounts: nextAccounts }, activeUserId);
      setStatus("Accounts synced");
    } catch {
      setStatus("Accounts saved locally, bridge failed");
    }
  }

  async function saveBudgetsToBridge(nextBudgets) {
    if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.budgets, activeUserId), nextBudgets);
    if (!APPS_SCRIPT_URL) return;
    try {
      await apiPost("saveBudgets", { budgets: nextBudgets }, activeUserId);
    } catch {
      setStatus("Budgets saved locally, bridge failed");
    }
  }

  async function saveRecurringToBridge(nextRules) {
    if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.recurringRules, activeUserId), nextRules);
    if (!APPS_SCRIPT_URL) return;
    try {
      await apiPost("saveRecurring", { recurringRules: nextRules }, activeUserId);
    } catch {
      setStatus("Recurring saved locally, bridge failed");
    }
  }

  function updateMonthlyBudget(nextValue) {
    const nextBudgets = {
      ...budgets,
      monthlyTotal: Math.max(0, Number(nextValue || 0)),
    };
    setBudgets(nextBudgets);
    saveBudgetsToBridge(nextBudgets);
  }

  function updateCategoryBudget(categoryName, nextValue) {
    const nextCategories = {
      ...budgets.categories,
      [categoryName]: Math.max(0, Number(nextValue || 0)),
    };
    const nextBudgets = {
      ...budgets,
      monthlyTotal: Object.values(nextCategories).reduce((sum, value) => sum + Number(value || 0), 0),
      categories: nextCategories,
    };
    setBudgets(nextBudgets);
    saveBudgetsToBridge(nextBudgets);
  }

  function updateAllocationTarget(bucketName, nextValue) {
    setAllocationTargets((current) => {
      const editBase =
        allocationEditRef.current?.bucketName === bucketName && allocationEditRef.current?.targets
          ? allocationEditRef.current.targets
          : current;
      const anchorKey = allocationEditRef.current?.anchorKey || allocationLastEditedRef.current;
      return rebalanceAllocationTargetWithAnchor(editBase, bucketName, nextValue, anchorKey);
    });
  }

  function beginAllocationTargetEdit(bucketName, event) {
    allocationEditRef.current = {
      anchorKey: allocationLastEditedRef.current,
      bucketName,
      targets: allocationTargets,
    };
    numericFieldFocus(event);
  }

  function finishAllocationTargetEdit() {
    if (allocationEditRef.current?.bucketName) {
      allocationLastEditedRef.current = allocationEditRef.current.bucketName;
    }
    allocationEditRef.current = null;
  }

  function completeBudgetSetup() {
    setBudgetSetupComplete(true);
    setBudgetSetupOpen(false);
    if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.budgetSetupComplete, activeUserId), true);
  }

  function reopenBudgetSetup() {
    setBudgetSetupOpen(true);
  }

  function addRecurringRule() {
    const nextRule = {
      id: `recurring-${Date.now()}`,
      name: "New reminder",
      category: expenseCategories[0] || DEFAULT_CATEGORIES[0],
      amount: 0,
      frequency: "monthly",
      dueDay: 1,
    };
    const nextRules = [nextRule, ...recurringRules];
    setRecurringRules(nextRules);
    saveRecurringToBridge(nextRules);
  }

  function updateRecurringRule(ruleId, patch) {
    const nextRules = recurringRules.map((rule) =>
      rule.id === ruleId ? { ...rule, ...patch, amount: patch.amount !== undefined ? Number(patch.amount || 0) : rule.amount } : rule,
    );
    setRecurringRules(nextRules);
    saveRecurringToBridge(nextRules);
  }

  function deleteRecurringRule(ruleId) {
    const nextRules = recurringRules.filter((rule) => rule.id !== ruleId);
    setRecurringRules(nextRules);
    saveRecurringToBridge(nextRules);
  }

  function handlePointerMove(event) {
    document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
    document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    document.documentElement.style.setProperty("--bubble-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--bubble-y", `${event.clientY}px`);
  }

  function handleTap(event) {
    document.documentElement.style.setProperty("--bubble-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--bubble-y", `${event.clientY}px`);
    const id = Date.now();
    setRipples((current) => [...current.slice(-4), { id, x: event.clientX, y: event.clientY }]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 900);
  }

  function saveUserWorkspace(event) {
    event.preventDefault();
    const profile = normalizeUserProfile({ email: userEmailDraft, privateKey: userKeyDraft });
    if (!profile) {
      setStatus("Enter email and private key");
      return;
    }
    const configuredProfile = getConfiguredWorkspaceProfile();
    const primaryProfile = getPrimaryWorkspaceProfile();
    const isPrimaryWorkspace = profilesMatch(profile, primaryProfile);
    if (configuredProfile && !isPrimaryWorkspace && !profilesMatch(profile, configuredProfile)) {
      setStatus("Email or private key does not match");
      return;
    }
    const activeProfile = isPrimaryWorkspace ? { ...primaryProfile, label: profile.label } : configuredProfile ? { ...configuredProfile, label: profile.label } : profile;
    setUserProfile(activeProfile);
    setUserEmailDraft(activeProfile.email);
    setUserKeyDraft(activeProfile.privateKey);
    setStatus("Workspace loaded");
  }

  function switchWorkspace() {
    setUserProfile(null);
    setUserEmailDraft(userProfile?.email || "");
    setUserKeyDraft(userProfile?.privateKey || "");
    setStatus("Choose workspace");
  }

  function pushUndo(label, undo) {
    setUndoStack((current) => [...current, { label, undo }].slice(-12));
  }

  function undoLastEdit() {
    setUndoStack((current) => {
      const next = [...current];
      const action = next.pop();
      if (action) action.undo();
      return next;
    });
  }

  function renameExpenseCategory(oldName, nextName) {
    const cleanName = nextName.trim();
    if (!cleanName || cleanName === oldName) return;
    if (expenseCategories.some((item) => item.toLowerCase() === cleanName.toLowerCase() && item !== oldName)) return;
    const previousCategories = expenseCategories;
    const previousBuckets = categoryBuckets;
    const previousTransactions = transactions;
    const previousCategory = category;
    const previousBudgets = budgets;
    const nextCategories = expenseCategories.map((item) => (item === oldName ? cleanName : item));
    const nextBuckets = { ...categoryBuckets, [cleanName]: categoryBuckets[oldName] || getBucket(oldName) };
    delete nextBuckets[oldName];
    const nextBudgets = {
      ...budgets,
      categories: {
        ...budgets.categories,
        [cleanName]: budgets.categories[oldName] ?? getDefaultCategoryBudget(cleanName),
      },
    };
    delete nextBudgets.categories[oldName];
    const nextTransactions = transactions.map((transaction) =>
      transaction.category === oldName
        ? { ...transaction, category: cleanName, bucket: transaction.direction === "income" ? "Income" : transaction.bucket }
        : transaction,
    );

    pushUndo(`category: ${oldName}`, () => {
      setExpenseCategories(previousCategories);
      setCategoryBuckets(previousBuckets);
      setTransactions(previousTransactions);
      setCategory(previousCategory);
      setBudgets(previousBudgets);
      saveCategoriesToBridge(previousCategories, previousBuckets);
      saveBudgetsToBridge(previousBudgets);
    });

    setExpenseCategories(nextCategories);
    setCategoryBuckets(nextBuckets);
    setTransactions(nextTransactions);
    setBudgets(nextBudgets);
    if (category === oldName) setCategory(cleanName);
    saveCategoriesToBridge(nextCategories, nextBuckets);
    saveBudgetsToBridge(nextBudgets);
  }

  function addExpenseCategory() {
    const cleanName = newCategoryDraft.trim();
    if (!cleanName) return;
    if (expenseCategories.some((item) => item.toLowerCase() === cleanName.toLowerCase())) {
      setStatus("Category already exists");
      setNewCategoryDraft("");
      setAddingCategory(false);
      return;
    }
    const previousCategories = expenseCategories;
    const previousBuckets = categoryBuckets;
    const previousCategory = category;
    const previousBudgets = budgets;
    const nextCategories = [...expenseCategories, cleanName];
    const nextBuckets = { ...categoryBuckets, [cleanName]: getBucket(cleanName) };
    const nextBudgets = {
      ...budgets,
      categories: { ...budgets.categories, [cleanName]: getDefaultCategoryBudget(cleanName) },
    };

    pushUndo(`category: ${cleanName}`, () => {
      setExpenseCategories(previousCategories);
      setCategoryBuckets(previousBuckets);
      setCategory(previousCategory);
      setBudgets(previousBudgets);
      saveCategoriesToBridge(previousCategories, previousBuckets);
      saveBudgetsToBridge(previousBudgets);
    });

    setExpenseCategories(nextCategories);
    setCategoryBuckets(nextBuckets);
    setBudgets(nextBudgets);
    setCategory(cleanName);
    setNewCategoryDraft("");
    setAddingCategory(false);
    saveCategoriesToBridge(nextCategories, nextBuckets);
    saveBudgetsToBridge(nextBudgets);
  }

  function renameIncomeSource(oldName, nextName) {
    const cleanName = nextName.trim();
    if (!cleanName || cleanName === oldName) return;
    const previousSources = incomeSources;
    const previousTransactions = transactions;
    const previousSource = incomeSource;

    pushUndo(`source: ${oldName}`, () => {
      setIncomeSources(previousSources);
      setTransactions(previousTransactions);
      setIncomeSource(previousSource);
    });

    setIncomeSources((current) => current.map((item) => (item === oldName ? cleanName : item)));
    setTransactions((current) => current.map((transaction) => (transaction.category === oldName ? { ...transaction, category: cleanName } : transaction)));
    if (incomeSource === oldName) setIncomeSource(cleanName);
  }

  function updateAccountField(accountId, patch, label = "account") {
    const currentAccount = accounts.find((account) => account.id === accountId);
    if (!currentAccount) return;
    if (patch.name !== undefined && patch.name === currentAccount.name) return;
    if (patch.balance !== undefined && Number(patch.balance || 0) === Number(currentAccount.balance || 0)) return;

    const previousAccounts = accounts;
    const nextAccounts = accounts.map((account) =>
      account.id === accountId
        ? {
            ...account,
            ...patch,
            balance: patch.balance !== undefined ? Math.max(0, Number(patch.balance || 0)) : account.balance,
            updatedAt: new Date().toISOString(),
          }
        : account,
    );
    pushUndo(label, () => {
      setAccounts(previousAccounts);
      saveAccountsToBridge(previousAccounts);
    });
    setAccounts(nextAccounts);
    saveAccountsToBridge(nextAccounts);
  }

  function addAccount() {
    const cleanName = newAccountDraft.trim();
    if (!cleanName || accounts.some((account) => account.name.toLowerCase() === cleanName.toLowerCase())) return;
    const previousAccounts = accounts;
    const previousSelected = selectedAccount;
    const nextAccount = {
      id: makeSlug(cleanName, accounts.map((account) => account.id)),
      name: cleanName,
      type: newAccountType,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
    const nextAccounts = [...accounts, nextAccount];

    pushUndo(`account: ${cleanName}`, () => {
      setAccounts(previousAccounts);
      setSelectedAccount(previousSelected);
      saveAccountsToBridge(previousAccounts);
    });

    setAccounts(nextAccounts);
    setSelectedAccount(nextAccount.id);
    setNewAccountDraft("");
    setNewAccountType("Bank");
    setAddingAccount(false);
    saveAccountsToBridge(nextAccounts);
  }

  function deleteAccount(accountId) {
    if (accounts.length <= 1) return;
    const isReferenced = transactions.some(
      (transaction) => transaction.accountId === accountId || transaction.fromAccountId === accountId || transaction.toAccountId === accountId,
    );
    if (isReferenced) {
      setStatus("Account has journal history and cannot be deleted");
      return;
    }
    const previousAccounts = accounts;
    const previousSelected = selectedAccount;
    const nextAccounts = accounts.filter((account) => account.id !== accountId);

    pushUndo("restore account", () => {
      setAccounts(previousAccounts);
      setSelectedAccount(previousSelected);
      saveAccountsToBridge(previousAccounts);
    });

    setAccounts(nextAccounts);
    if (selectedAccount === accountId) setSelectedAccount(nextAccounts[0]?.id || "");
    saveAccountsToBridge(nextAccounts);
  }

  function adjustAccount(accountId, delta, persist = true) {
    const nextAccounts = accounts.map((account) =>
      account.id === accountId
        ? { ...account, balance: Math.max(0, Number(account.balance || 0) + delta), updatedAt: new Date().toISOString() }
        : account,
    );
    setAccounts(nextAccounts);
    if (persist) saveAccountsToBridge(nextAccounts);
    return nextAccounts;
  }

  function applyTransfer(accountsToUpdate, fromAccountId, toAccountId, transferAmount) {
    const updatedAt = new Date().toISOString();
    return accountsToUpdate.map((account) => {
      if (account.id === fromAccountId) return { ...account, balance: Number(account.balance || 0) - transferAmount, updatedAt };
      if (account.id === toAccountId) return { ...account, balance: Number(account.balance || 0) + transferAmount, updatedAt };
      return account;
    });
  }

  function deleteTransaction(transactionId) {
    const deletedTransaction = transactions.find((transaction) => transaction.id === transactionId);
    if (!deletedTransaction) return;
    const reversalDebitAccountId = deletedTransaction.direction === "transfer"
      ? deletedTransaction.toAccountId
      : deletedTransaction.direction === "income"
        ? deletedTransaction.accountId
        : "";
    const reversalDebitAccount = accounts.find((account) => account.id === reversalDebitAccountId);
    if (reversalDebitAccount && Number(reversalDebitAccount.balance || 0) < Number(deletedTransaction.amount || 0)) {
      setStatus(`Cannot delete: only ₹${formatMoney(reversalDebitAccount.balance)} remains in ${reversalDebitAccount.name}`);
      return;
    }
    const confirmed = window.confirm("Delete this journal entry?");
    if (!confirmed) return;

    const previousTransactions = transactions;
    const previousAccounts = accounts;
    const nextTransactions = transactions.filter((transaction) => transaction.id !== transactionId);
    const balanceDelta = deletedTransaction.direction === "income" ? -deletedTransaction.amount : deletedTransaction.amount;
    const nextAccounts = deletedTransaction.direction === "transfer"
      ? applyTransfer(accounts, deletedTransaction.toAccountId, deletedTransaction.fromAccountId, Number(deletedTransaction.amount || 0))
      : deletedTransaction.accountId
      ? accounts.map((account) =>
          account.id === deletedTransaction.accountId
            ? { ...account, balance: Math.max(0, Number(account.balance || 0) + balanceDelta), updatedAt: new Date().toISOString() }
            : account,
        )
      : accounts;

    pushUndo("deleted entry", () => {
      setTransactions(previousTransactions);
      setAccounts(previousAccounts);
      writeStoredTransactions(activeUserId, previousTransactions);
      if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, activeUserId), previousAccounts);
      apiPost(deletedTransaction.direction === "income" ? "addIncome" : deletedTransaction.direction === "transfer" ? "addTransfer" : "addExpense", {
        ...deletedTransaction,
      }, activeUserId)
        .then((data) => {
          if (Array.isArray(data?.accounts)) setAccounts(normalizeAccounts(data.accounts));
        })
        .catch(() => {
          setStatus("Entry restored locally, bridge failed");
        });
    });

    setTransactions(nextTransactions);
    writeStoredTransactions(activeUserId, nextTransactions);
    setAccounts(nextAccounts);
    if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, activeUserId), nextAccounts);
    setStatus("Entry deleted");
    apiPost("deleteTransaction", {
      id: transactionId,
      transactionId,
    }, activeUserId).then((data) => {
      if (Array.isArray(data?.accounts)) setAccounts(normalizeAccounts(data.accounts));
      setStatus("Entry deleted from sheet");
    }).catch(() => {
      setStatus("Entry deleted locally, bridge failed");
    });
  }

  function addOrUpdateAsset(name, type, balance) {
    const normalizedName = name.trim();
    if (!normalizedName) return null;
    const id = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const nextAccount = {
      id,
      name: normalizedName,
      type,
      balance: Number(balance || 0),
      updatedAt: new Date().toISOString(),
    };
    const exists = accounts.some((account) => account.id === id);
    const nextAccounts = exists ? accounts.map((account) => (account.id === id ? nextAccount : account)) : [nextAccount, ...accounts];
    setAccounts(nextAccounts);
    setSelectedAccount(id);
    saveAccountsToBridge(nextAccounts);
    return nextAccount;
  }

  async function submitEntry(event) {
    event.preventDefault();
    const numericAmount = evaluateAmountExpression(amount);
    if (!numericAmount || numericAmount <= 0) return;
    if (entryMode === "expense" && !category) {
      setStatus("Choose expense category first");
      return;
    }

    const selectedEntryAccount = accounts.find((account) => account.id === selectedAccount);
    if (entryMode === "expense" && (!selectedEntryAccount || numericAmount > Number(selectedEntryAccount.balance || 0))) {
      setStatus(`Only ₹${formatMoney(selectedEntryAccount?.balance || 0)} is available in ${selectedEntryAccount?.name || "this account"}`);
      return;
    }

    if (entryMode === "transfer") {
      const fromAccount = accounts.find((account) => account.id === transferFromAccount);
      const toAccount = accounts.find((account) => account.id === transferToAccount);
      if (!fromAccount || !toAccount) {
        setStatus("Choose both transfer accounts");
        return;
      }
      if (fromAccount.id === toAccount.id) {
        setStatus("Choose two different accounts");
        return;
      }
      if (numericAmount > Number(fromAccount.balance || 0)) {
        setStatus(`Only ₹${formatMoney(fromAccount.balance)} is available in ${fromAccount.name}`);
        return;
      }

      const isSavingsReversal = transferCountsAsSavings && fromAccount.type === "Market" && toAccount.type !== "Market";
      const availableSavingsBasis = isSavingsReversal ? getSavingsTransferBasis(transactions, fromAccount.id) : numericAmount;
      const availableBurnBasis = isSavingsReversal ? getSavingsBurnBasis(transactions, fromAccount.id) : numericAmount;
      const burnAmount = transferCountsTowardBurn ? Math.min(numericAmount, availableBurnBasis) : 0;
      const savingsAmount = transferCountsAsSavings ? Math.min(numericAmount, availableSavingsBasis) : 0;
      const entry = {
        ...makeEntry(
          numericAmount,
          transferCountsAsSavings ? "Investments" : `${fromAccount.name} → ${toAccount.name}`,
          "transfer",
          fromAccount.id,
          dateFromInputValue(entryDate),
          note.trim(),
        ),
        bucket: transferCountsAsSavings ? "Savings" : "Transfer",
        countsAsSavings: transferCountsAsSavings,
        countsTowardBurn: transferCountsTowardBurn,
        burnEffect: transferCountsTowardBurn && isSavingsReversal ? -1 : transferCountsTowardBurn ? 1 : 0,
        burnAmount,
        savingsEffect: transferCountsAsSavings && isSavingsReversal ? -1 : transferCountsAsSavings ? 1 : 0,
        savingsAmount,
        fromAccountId: fromAccount.id,
        fromAccount: fromAccount.name,
        toAccountId: toAccount.id,
        toAccount: toAccount.name,
      };
      const nextAccounts = applyTransfer(accounts, fromAccount.id, toAccount.id, numericAmount);
      const nextTransactions = [entry, ...transactions];
      setTransactions(nextTransactions);
      setAccounts(nextAccounts);
      writeStoredTransactions(activeUserId, nextTransactions);
      if (activeUserId) writeStoredValue(getScopedStorageKey(STORAGE_KEYS.accounts, activeUserId), nextAccounts);
      setAmount("");
      setNote("");
      setEntryDate(getDateInputValue());
      setTransferCountsAsSavings(false);
      setTransferCountsTowardBurn(false);
      setStatus("Transfer logged");
      apiPost("addTransfer", entry, activeUserId)
        .then((data) => {
          if (Array.isArray(data?.accounts)) setAccounts(normalizeAccounts(data.accounts));
          setStatus(APPS_SCRIPT_URL ? "Transfer synced" : "Saved locally");
        })
        .catch(() => setStatus("Transfer saved locally, bridge failed"));
      return;
    }

    const direction = entryMode;
    const entry = makeEntry(numericAmount, activeCategory, direction, selectedAccount, dateFromInputValue(entryDate), note.trim());
    if (direction === "expense") entry.bucket = activeBucket;
    setTransactions((current) => {
      const nextTransactions = [entry, ...current];
      writeStoredTransactions(activeUserId, nextTransactions);
      return nextTransactions;
    });
    const nextAccounts = adjustAccount(selectedAccount, direction === "expense" ? -numericAmount : numericAmount, false);
    setAmount("");
    setNote("");
    setEntryDate(getDateInputValue());
    if (direction === "expense") setCategory("");
    setStatus("Entry logged");

    apiPost(direction === "expense" ? "addExpense" : "addIncome", {
        ...entry,
        type: entry.bucket,
        source: activeCategory,
        account: selectedAccountLabel,
        accountId: selectedAccount,
      }, activeUserId)
      .then((data) => {
        if (Array.isArray(data?.accounts)) setAccounts(normalizeAccounts(data.accounts));
        setStatus(APPS_SCRIPT_URL ? `${direction === "expense" ? "Expense" : "Income"} synced` : "Saved locally");
      })
      .catch(() => {
        setStatus("Local save, bridge failed");
      });
  }

  async function saveAssets(event) {
    event.preventDefault();
    const payload = {
      stocks: Number(draftAssets.stocks || 0),
      mf: Number(draftAssets.mutualFunds || 0),
      cells: {
        C16: Number(draftAssets.mutualFunds || 0),
        C17: Number(draftAssets.stocks || 0),
      },
      valuations: {
        mutualFunds: Number(draftAssets.mutualFunds || 0),
        stocks: Number(draftAssets.stocks || 0),
      },
      timestamp: new Date().toISOString(),
    };

    setBusy(true);
    setStatus("Syncing assets...");
    const syncedAccounts = accounts.map((account) => {
      if (account.id === "stocks") return { ...account, balance: payload.valuations.stocks, updatedAt: payload.timestamp };
      if (account.id === "mutualFunds") return { ...account, balance: payload.valuations.mutualFunds, updatedAt: payload.timestamp };
      return account;
    });
    try {
      await apiPost("updateGroww", payload, activeUserId);
      setAssets(payload.valuations);
      setAccounts(syncedAccounts);
      await saveAccountsToBridge(syncedAccounts);
      await syncDashboard(true);
      setSyncOpen(false);
      setStatus(APPS_SCRIPT_URL ? "Assets synced to C16/C17" : "Assets saved locally");
    } catch {
      setAssets(payload.valuations);
      setAccounts(syncedAccounts);
      await saveAccountsToBridge(syncedAccounts);
      setSyncOpen(false);
      setStatus("Local asset save, bridge failed");
    } finally {
      setBusy(false);
    }
  }

  const today = new Date();

  return (
    <main className={`app mobile-${mobilePage} ${mobileJournalOpen ? "mobile-journal-open" : ""}`} onClick={handleTap} onPointerMove={handlePointerMove}>
      <div className="bubble-field" aria-hidden="true">
        {Array.from({ length: 13 }).map((_, index) => (
          <span className={`bubble bubble-${index + 1}`} key={index} />
        ))}
        {ripples.map((ripple) => (
          <i className="tap-ripple" key={ripple.id} style={{ left: ripple.x, top: ripple.y }} />
        ))}
      </div>

      {!userProfile && (
        <div className="modal-layer user-gate-layer" role="presentation">
          <form className="user-gate glass" onSubmit={saveUserWorkspace}>
            <div className="user-gate-brand">
              <img alt="LogXpens logo" className="user-gate-logo" src="/logxpens-logo.png" />
              <div>
                <span className="section-label">Private workspace</span>
                <h2>Open your finance command center</h2>
                <p>Use the same email and private key together every time. Entries in the shared Google Sheet stay separated by this combined workspace ID.</p>
              </div>
            </div>
            <label className="asset-input">
              <span>Email</span>
              <input
                autoFocus
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={userEmailDraft}
                onChange={(event) => setUserEmailDraft(event.target.value)}
              />
            </label>
            <label className="asset-input">
              <span>Private key</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="my-private-key"
                value={userKeyDraft}
                onChange={(event) => setUserKeyDraft(event.target.value)}
              />
            </label>
            <button className="submit-button" type="submit">
              <Check size={18} />
              <span>Enter workspace</span>
            </button>
          </form>
        </div>
      )}

      <section className="journal-panel glass">
        <div className="panel-kicker">
          <CalendarDays size={16} />
          <span>{today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          <strong className={hydrating ? "is-loading" : ""}>{hydrating ? "Loading workspace" : status}</strong>
        </div>

        <div className="journal-title">
          <img alt="LogXpens logo" className="brand-mark" src="/logxpens-logo.png" />
          <h1>Finance Command Center</h1>
        </div>

        <div className="entry-tabs" role="tablist" aria-label="Ledger entry type">
          {ENTRY_TABS.map((tab) => (
            <button
              aria-selected={entryMode === tab.id}
              className={`entry-tab ${entryMode === tab.id ? "is-active" : ""}`}
              key={tab.id}
              onClick={() => {
                setEntryMode(tab.id);
                setCategory("");
              }}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="entry-toolbar">
          <button
            aria-label="Go back one edit"
            className="undo-button"
            disabled={!undoStack.length}
            onClick={undoLastEdit}
            title="Go back one edit"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <form className="entry-form" onSubmit={submitEntry}>
          <label className="amount-field amount-field-top" aria-label={`${entryMode} amount`}>
            <IndianRupee size={34} />
            <input
              value={amount}
              inputMode="decimal"
              placeholder="0"
              type="text"
              onChange={(event) => setAmount(event.target.value)}
            />
            {amountNeedsCalculation && (
              <button
                aria-label={`Use calculated amount ${calculatedAmount}`}
                className="amount-calc-button"
                onClick={() => setAmount(String(calculatedAmount))}
                title={`Use ${calculatedAmount}`}
                type="button"
              >
                <Check size={18} />
              </button>
            )}
          </label>

          <div className="note-cluster">
              <label className="entry-date-field">
                <span>Date</span>
                <input
                  aria-label="Entry date"
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                />
              </label>
              <div className="note-field">
                <label htmlFor="entry-description">Description</label>
                <div className={`description-input-shell ${note ? "has-description" : ""}`}>
                  <input
                    id="entry-description"
                    value={note}
                    maxLength={90}
                    placeholder="Optional context: vendor, place, reason..."
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="note-suggestions" aria-hidden="true">
                    {NOTE_SUGGESTIONS.map((suggestion, index) => (
                      <span key={suggestion} style={{ "--hint-index": index }}>
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
          </div>

          {entryMode === "expense" && !category && (
            <div className="category-grid fade-panel" role="radiogroup" aria-label="Expense category">
              {expenseCategories.map((item) => {
                const progress = categoryProgressByName[item] || { spent: 0, limit: budgets.categories[item] || 0, percent: 0, status: "calm" };
                return (
                  <div
                    aria-checked={category === item}
                    className={`category-token editable-token ${category === item ? "is-active" : ""}`}
                    key={item}
                    onClick={() => setCategory(item)}
                    role="radio"
                    tabIndex={0}
                  >
                    <span className="editable-display">{item}</span>
                    <span className="category-budget-meta">
                      ₹{formatMoney(progress.spent)} / ₹{formatMoney(progress.limit)}
                    </span>
                    <span className="category-progress-line" aria-hidden="true">
                      <i className={`is-${progress.status}`} style={{ width: `${Math.min(100, progress.percent)}%` }} />
                    </span>
                  </div>
                );
              })}
              {addingCategory ? (
                <div className="category-token add-editor-token">
                  <input
                    autoFocus
                    aria-label="New expense category"
                    placeholder="New category"
                    value={newCategoryDraft}
                    onChange={(event) => setNewCategoryDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addExpenseCategory();
                      }
                      if (event.key === "Escape") {
                        setAddingCategory(false);
                        setNewCategoryDraft("");
                      }
                    }}
                  />
                  <button aria-label="Save category" className="token-action-button" onClick={addExpenseCategory} type="button">
                    <Check size={14} />
                  </button>
                  <button
                    aria-label="Cancel category"
                    className="token-action-button"
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryDraft("");
                    }}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className="category-token add-token" onClick={() => setAddingCategory(true)} type="button">
                  <Plus size={18} />
                  <span>Category</span>
                </button>
              )}
            </div>
          )}

          {entryMode === "expense" && category && (
            <div className="selected-flow-card fade-panel">
              <button aria-label="Change expense category" className="back-chip" onClick={() => setCategory("")} type="button">
                <ArrowLeft size={16} />
              </button>
              <div>
                <span>Category</span>
                <strong>
                  <TapToEditText value={category} onCommit={(nextName) => renameExpenseCategory(category, nextName)} />
                </strong>
              </div>
              <b>{selectedAccountLabel}</b>
            </div>
          )}

          {entryMode === "transfer" && (
            <div className="transfer-panel fade-panel">
              <div className="transfer-route">
                <label className="mini-input">
                  <span>From</span>
                  <select value={transferFromAccount} onChange={(event) => setTransferFromAccount(event.target.value)}>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.name} · ₹{formatMoney(account.balance)}</option>
                    ))}
                  </select>
                </label>
                <ArrowRightLeft aria-hidden="true" size={20} />
                <label className="mini-input">
                  <span>To</span>
                  <select value={transferToAccount} onChange={(event) => setTransferToAccount(event.target.value)}>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.name} · ₹{formatMoney(account.balance)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="savings-transfer-toggle">
                <input
                  checked={transferCountsAsSavings}
                  onChange={(event) => setTransferCountsAsSavings(event.target.checked)}
                  type="checkbox"
                />
                <span aria-hidden="true" />
                <div>
                  <strong>Add to Savings</strong>
                  <small>Include this movement in the Savings allocation.</small>
                </div>
              </label>
              <label className="savings-transfer-toggle burn-transfer-toggle">
                <input
                  checked={transferCountsTowardBurn}
                  onChange={(event) => setTransferCountsTowardBurn(event.target.checked)}
                  type="checkbox"
                />
                <span aria-hidden="true" />
                <div>
                  <strong>
                    {isTransferSavingsReversal
                      ? "Remove from Burn"
                      : "Add to Burn"}
                  </strong>
                  <small>
                    {isTransferSavingsReversal
                      ? `Reverse up to ₹${formatMoney(transferBurnBasis)} of previously counted savings burn.`
                      : "Include this amount in Total Burn and its trend."}
                  </small>
                </div>
              </label>
            </div>
          )}

          {entryMode !== "transfer" && canChooseChannel && (
            <div className="channel-panel fade-panel">
              <span className="section-label">{entryMode === "expense" ? "Paid through" : "Received into"}</span>
              <div className="account-grid" role="radiogroup" aria-label="Account or asset source">
                {accounts.map((account) => (
                  <div
                    aria-checked={selectedAccount === account.id}
                    className={`account-token ${selectedAccount === account.id ? "is-active" : ""}`}
                    key={account.id}
                    onClick={() => setSelectedAccount(account.id)}
                    role="radio"
                    tabIndex={0}
                  >
                    <span>{account.name}</span>
                    <button
                      aria-label={`Delete ${account.name}`}
                      className="token-delete-button account-delete-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteAccount(account.id);
                      }}
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {addingAccount ? (
                  <div className="account-token add-editor-token">
                    <input
                      autoFocus
                      aria-label="New account"
                      placeholder="New account"
                      value={newAccountDraft}
                      onChange={(event) => setNewAccountDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addAccount();
                        }
                        if (event.key === "Escape") {
                          setAddingAccount(false);
                          setNewAccountDraft("");
                          setNewAccountType("Bank");
                        }
                      }}
                    />
                    <select aria-label="New account type" value={newAccountType} onChange={(event) => setNewAccountType(event.target.value)}>
                      <option>Bank</option>
                      <option>Market</option>
                      <option>Cash</option>
                      <option>Real Estate</option>
                      <option>Other</option>
                    </select>
                    <button aria-label="Save account" className="token-action-button" onClick={addAccount} type="button">
                      <Check size={14} />
                    </button>
                    <button
                      aria-label="Cancel account"
                      className="token-action-button"
                      onClick={() => {
                        setAddingAccount(false);
                        setNewAccountDraft("");
                        setNewAccountType("Bank");
                      }}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button className="account-token add-token" onClick={() => setAddingAccount(true)} type="button">
                    <Plus size={17} />
                    <span>Account</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <button className="submit-button" type="submit">
            {busy ? <Loader2 className="spin" size={18} /> : entryMode === "transfer" ? <ArrowRightLeft size={18} /> : <Send size={18} />}
            <span>{entryMode === "transfer" ? "Move money" : "Log entry"}</span>
          </button>
        </form>

        <div className={`recent-stack ${mobileJournalOpen ? "is-open" : ""}`}>
          <div className="journal-filter-head">
            <div>
              <span className="section-label">Recent journal marks</span>
              <strong>₹{formatMoney(journalSpendTotal)}</strong>
            </div>
            <button className="mobile-section-toggle" onClick={() => setMobileJournalOpen((open) => !open)} type="button">
              <span>{filteredJournalEntries.length} shown</span>
              <ChevronDown size={15} />
            </button>
            <span className="journal-count">{filteredJournalEntries.length} shown</span>
          </div>
          <div className="journal-filters" aria-label="Journal filters">
            <label>
              <span>Category</span>
              <select value={journalCategory} onChange={(event) => setJournalCategory(event.target.value)}>
                <option value="all">All categories</option>
                {journalOptions.categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Month</span>
              <select value={journalMonth} onChange={(event) => setJournalMonth(event.target.value)}>
                <option value="all">All months</option>
                {journalOptions.months.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Week</span>
              <select value={journalWeek} onChange={(event) => setJournalWeek(event.target.value)}>
                <option value="all">All weeks</option>
                {journalOptions.weeks.map((item) => (
                  <option key={item} value={item}>
                    W{item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Spend</span>
              <select value={journalSpend} onChange={(event) => setJournalSpend(event.target.value)}>
                {JOURNAL_SPEND_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Type</span>
              <select value={journalDirection} onChange={(event) => setJournalDirection(event.target.value)}>
                <option value="all">All entries</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
                <option value="transfer">Transfers</option>
              </select>
            </label>
            <label>
              <span>Description</span>
              <select value={journalNoteMode} onChange={(event) => setJournalNoteMode(event.target.value)}>
                <option value="all">All descriptions</option>
                <option value="with">With description</option>
                <option value="without">No description</option>
              </select>
            </label>
          </div>
          <div className="recent-list" aria-label="Recent journal entries">
            {filteredJournalEntries.slice(0, 50).map((transaction) => (
            <article className="transaction-row" key={transaction.id}>
              <div>
                <strong>{transaction.category}</strong>
                {transaction.note && <em>{transaction.note}</em>}
              </div>
              <b className={transaction.direction === "income" ? "is-income" : transaction.direction === "transfer" ? "is-transfer" : "is-expense"}>
                {transaction.direction === "income" ? "+" : transaction.direction === "transfer" ? "↔" : "-"}₹{formatMoney(transaction.amount)}
              </b>
              <button
                aria-label={`Delete ${transaction.category} entry`}
                className="transaction-delete journal-delete-button"
                onClick={() => deleteTransaction(transaction.id)}
                title="Delete entry"
                type="button"
              >
                <Trash2 size={13} />
              </button>
            </article>
            ))}
            {!filteredJournalEntries.length && <div className="empty-journal">No journal entries match these filters</div>}
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <header className="dashboard-header glass">
          <div>
            <span className="section-label">Atmospheric finance canvas</span>
            <h2>{analytics.displayLabel}</h2>
          </div>
          <div className="dashboard-actions">
            <div className="period-tabs" role="tablist" aria-label="Graph period">
              {PERIOD_TABS.map((tab) => (
                <button
                  aria-selected={periodTab === tab.id}
                  className={`period-tab ${periodTab === tab.id ? "is-active" : ""}`}
                  key={tab.id}
                  onClick={() => setPeriodTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {periodTab === "monthly" && (
              <label className="dashboard-month-filter">
                <span>Month</span>
                <select
                  aria-label="Select dashboard month"
                  value={selectedDashboardMonth}
                  onChange={(event) => {
                    dashboardMonthTouchedRef.current = true;
                    setSelectedDashboardMonth(event.target.value);
                  }}
                >
                  {dashboardMonthOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="sync-button" type="button" onClick={() => setSyncOpen(true)}>
              <RefreshCw size={17} />
              <span>Asset sync</span>
            </button>
            <button className="sync-button user-chip" type="button" onClick={switchWorkspace}>
              <WalletCards size={17} />
              <span>{userProfile ? "Workspace" : "Connect"}</span>
            </button>
          </div>
        </header>

        <section className="command-grid" aria-label="Budget recurring and allocation controls">
          <button className={`command-heading ${budgetSetupOpen ? "is-open" : ""}`} onClick={budgetSetupOpen ? completeBudgetSetup : reopenBudgetSetup} type="button">
            <span className="section-label">Set Budget for the Month</span>
            <span className="command-heading-action">
              {budgetSetupOpen ? "Done" : "Open"}
              <ChevronDown size={16} />
            </span>
          </button>
          {budgetSetupOpen ? (
            <>
          <section className={`command-card budget-command-card glass is-${budgetPulseTone} ${budgetSetupOpen ? "is-open" : ""}`} aria-label="Monthly budget">
            <div className="budget-pulse-copy">
              <span className="section-label">Budget</span>
              <strong>
                &#8377;{formatMoney(analytics.monthlyBudgetSpent)} / &#8377;{formatMoney(budgets.monthlyTotal)}
              </strong>
              <p>
                {analytics.overspend > 0
                  ? `Over by ${formatMoney(analytics.overspend)}`
                  : `${formatMoney(analytics.budgetRemaining)} left`}
              </p>
            </div>
            <div className="budget-pulse-track" aria-hidden="true">
              <i style={{ width: `${budgetProgressPercent}%` }} />
            </div>

            {budgetSetupOpen && (
              <div className="budget-inline-editor">
                <label className="budget-total-input">
                  <span>Total target</span>
                  <input
                    aria-label="Monthly total budget"
                    inputMode="decimal"
                    type="number"
                    placeholder="0"
                    value={numericInputValue(budgets.monthlyTotal)}
                    onFocus={numericFieldFocus}
                    onChange={(event) => updateMonthlyBudget(event.target.value)}
                  />
                </label>
                <div className="budget-limit-grid">
                  {analytics.categoryProgress.map((item) => (
                    <label className={`budget-limit-line is-${item.status}`} key={item.name}>
                      <span>{item.name}</span>
                      <b>&#8377;{formatMoney(item.spent)}</b>
                      <input
                        aria-label={`${item.name} budget limit`}
                        inputMode="decimal"
                        type="number"
                        placeholder="0"
                        value={numericInputValue(budgets.categories[item.name])}
                        onFocus={numericFieldFocus}
                        onChange={(event) => updateCategoryBudget(item.name, event.target.value)}
                      />
                      <i aria-hidden="true">
                        <em style={{ width: `${Math.min(100, item.percent)}%` }} />
                      </i>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={`command-card recurring-command-card glass ${recurringSetupOpen ? "is-open" : ""}`} aria-label="Recurring schedule">
            <div className="command-card-copy">
              <span className="section-label">Recurring</span>
              <strong>&#8377;{formatMoney(analytics.recurringMonthlyLoad)} monthly load</strong>
              <p>
                {nextRecurringItem
                  ? `${nextRecurringItem.name} due in ${nextRecurringItem.daysUntil}d`
                  : "No reminders set"}
              </p>
            </div>
            <div className="command-card-actions">
              <button className="mini-action-button" onClick={addRecurringRule} type="button">
                <Plus size={15} />
                <span>Add</span>
              </button>
              <button className="mini-action-button" onClick={() => setRecurringSetupOpen((open) => !open)} type="button">
                <Repeat size={15} />
                <span>{recurringSetupOpen ? "Done" : "Manage"}</span>
              </button>
            </div>

            {recurringSetupOpen && (
              <div className="recurring-list">
                {recurringRules.map((rule) => {
                  const nextDue = getNextDueDate(rule, today);
                  return (
                    <article className="recurring-row" key={rule.id}>
                      <input
                        aria-label={`${rule.name} name`}
                        value={rule.name}
                        onChange={(event) => updateRecurringRule(rule.id, { name: event.target.value })}
                      />
                      <select
                        aria-label={`${rule.name} category`}
                        value={rule.category}
                        onChange={(event) => updateRecurringRule(rule.id, { category: event.target.value })}
                      >
                        {expenseCategories.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                      <input
                        aria-label={`${rule.name} amount`}
                        inputMode="decimal"
                        type="number"
                        placeholder="0"
                        value={numericInputValue(rule.amount)}
                        onFocus={numericFieldFocus}
                        onChange={(event) => updateRecurringRule(rule.id, { amount: event.target.value })}
                      />
                      <select
                        aria-label={`${rule.name} frequency`}
                        value={rule.frequency}
                        onChange={(event) => updateRecurringRule(rule.id, { frequency: event.target.value })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                      <input
                        aria-label={`${rule.name} due day`}
                        inputMode="numeric"
                        max={rule.frequency === "weekly" ? "6" : "31"}
                        min="1"
                        type="number"
                        placeholder="1"
                        value={numericInputValue(rule.dueDay)}
                        onFocus={numericFieldFocus}
                        onChange={(event) => updateRecurringRule(rule.id, { dueDay: event.target.value })}
                      />
                      <span>
                        {nextDue.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {getDaysUntil(nextDue, today)}d
                      </span>
                      <button aria-label={`Delete ${rule.name}`} className="transaction-delete" onClick={() => deleteRecurringRule(rule.id)} type="button">
                        <Trash2 size={13} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className={`command-card allocation-target-card glass ${allocationTargetTotal === 100 ? "" : "is-warn"}`} aria-label="Needs wants savings targets">
            <div className="command-card-copy">
              <span className="section-label">Split</span>
              <strong>{allocationTargets.needs}/{allocationTargets.wants}/{allocationTargets.savings}</strong>
              <p>{allocationTargetTotal === 100 ? "Targets balance to 100%" : `Adjust total from ${allocationTargetTotal}% to 100%`}</p>
            </div>
            <div className="target-input-grid">
              {[
                ["needs", "Needs"],
                ["wants", "Wants"],
                ["savings", "Savings"],
              ].map(([key, label]) => (
                <label className="target-input" key={key}>
                  <span>{label}</span>
                  <input
                    aria-label={`${label} allocation target`}
                    inputMode="decimal"
                    max="100"
                    min="0"
                    type="number"
                    placeholder="0"
                    value={numericInputValue(allocationTargets[key])}
                    onFocus={(event) => beginAllocationTargetEdit(key, event)}
                    onBlur={finishAllocationTargetEdit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    onChange={(event) => updateAllocationTarget(key, event.target.value)}
                  />
                  <small>Actual {analytics.allocations[key]}%</small>
                </label>
              ))}
            </div>
          </section>
            </>
          ) : (
            <section className="command-summary glass" aria-label="Budget summary">
              <div>
                <span>Monthly budget</span>
                <strong>&#8377;{formatMoney(budgets.monthlyTotal)}</strong>
              </div>
              <div>
                <span>Recurring</span>
                <strong>&#8377;{formatMoney(analytics.recurringMonthlyLoad)}</strong>
              </div>
              <div>
                <span>Target split</span>
                <strong>{allocationTargets.needs}/{allocationTargets.wants}/{allocationTargets.savings}</strong>
              </div>
            </section>
          )}
        </section>

        {false && budgetSetupComplete && !budgetSetupOpen && (
          <section className={`budget-pulse glass is-${budgetPulseTone}`} aria-label="Monthly budget pulse">
            <div className="budget-pulse-copy">
              <span className="section-label">Monthly budget</span>
              <strong>
                &#8377;{formatMoney(analytics.monthlyBudgetSpent)} / &#8377;{formatMoney(budgets.monthlyTotal)}
              </strong>
            </div>
            <div className="budget-pulse-track" aria-hidden="true">
              <i style={{ width: `${budgetProgressPercent}%` }} />
            </div>
            <div className="budget-pulse-meta">
              <span>
                {analytics.overspend > 0
                  ? `Over by ${formatMoney(analytics.overspend)}`
                  : `${formatMoney(analytics.budgetRemaining)} left`}
              </span>
              <button className="mini-action-button" onClick={reopenBudgetSetup} type="button">
                <Target size={15} />
                <span>Edit limits</span>
              </button>
            </div>
          </section>
        )}

        <section className="metric-grid">
          <MetricCard icon={<WalletCards size={18} />} label="Total Burn" value={`₹${formatMoney(analytics.totalBurn)}`} />
          <MetricCard icon={<PiggyBank size={18} />} label="Budget Left" value={`₹${formatMoney(analytics.budgetRemaining)}`} />
          <MetricCard icon={<Banknote size={18} />} label="Needs / Wants / Savings" value={`${analytics.allocations.needs}/${analytics.allocations.wants}/${analytics.allocations.savings}%`} />
        </section>

        <section className="planning-console glass">
          <div className="planner-tabs" role="tablist" aria-label="Planning console">
            {PLANNER_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  aria-selected={plannerTab === tab.id}
                  className={`planner-tab ${plannerTab === tab.id ? "is-active" : ""}`}
                  key={tab.id}
                  onClick={() => setPlannerTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {plannerTab === "budget" && (
            <div className="planner-panel budget-panel" role="tabpanel">
              {budgetSetupComplete && !budgetSetupOpen ? (
                <div className="budget-collapsed">
                  <div>
                    <span className="section-label">Budget limits are tucked away</span>
                    <strong>&#8377;{formatMoney(analytics.budgetRemaining)} remaining this month</strong>
                    <p>Category lines keep tracking spend above the fold. Open limits only when targets need tuning.</p>
                  </div>
                  <button className="mini-action-button" onClick={reopenBudgetSetup} type="button">
                    <Target size={15} />
                    <span>Edit limits</span>
                  </button>
                </div>
              ) : (
                <>
              <div className="budget-hero budget-setup-card">
                <div>
                  <span className="section-label">One-time monthly limit</span>
                  <strong>₹{formatMoney(analytics.monthlyBudgetSpent)} / ₹{formatMoney(budgets.monthlyTotal)}</strong>
                  <p>
                    Forecast closes near ₹{formatMoney(analytics.forecast.projectedBurn)} with ₹{formatMoney(analytics.budgetRemaining)} currently unassigned.
                  </p>
                </div>
                <label className="budget-total-input">
                  <span>Total target</span>
                  <input
                    aria-label="Monthly total budget"
                    inputMode="decimal"
                    type="number"
                    placeholder="0"
                    value={numericInputValue(budgets.monthlyTotal)}
                    onFocus={numericFieldFocus}
                    onChange={(event) => updateMonthlyBudget(event.target.value)}
                  />
                </label>
                <button className="mini-action-button budget-save-button" onClick={completeBudgetSetup} type="button">
                  <Check size={15} />
                  <span>Set budget</span>
                </button>
              </div>

              <div className="budget-limit-grid">
                {analytics.categoryProgress.map((item) => (
                  <label className={`budget-limit-line is-${item.status}`} key={item.name}>
                    <span>{item.name}</span>
                    <b>₹{formatMoney(item.spent)}</b>
                    <input
                      aria-label={`${item.name} budget limit`}
                      inputMode="decimal"
                      type="number"
                      placeholder="0"
                      value={numericInputValue(budgets.categories[item.name])}
                      onFocus={numericFieldFocus}
                      onChange={(event) => updateCategoryBudget(item.name, event.target.value)}
                    />
                    <i aria-hidden="true">
                      <em style={{ width: `${Math.min(100, item.percent)}%` }} />
                    </i>
                  </label>
                ))}
              </div>
                </>
              )}
            </div>
          )}

          {plannerTab === "recurring" && (
            <div className="planner-panel recurring-panel" role="tabpanel">
              <div className="planner-panel-heading">
                <div>
                  <span className="section-label">Recurring watchlist</span>
                  <strong>₹{formatMoney(analytics.recurringMonthlyLoad)} expected this month</strong>
                </div>
                <button className="mini-action-button" onClick={addRecurringRule} type="button">
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </div>

              <div className="recurring-list">
                {recurringRules.map((rule) => {
                  const nextDue = getNextDueDate(rule, today);
                  return (
                    <article className="recurring-row" key={rule.id}>
                      <input
                        aria-label={`${rule.name} name`}
                        value={rule.name}
                        onChange={(event) => updateRecurringRule(rule.id, { name: event.target.value })}
                      />
                      <select
                        aria-label={`${rule.name} category`}
                        value={rule.category}
                        onChange={(event) => updateRecurringRule(rule.id, { category: event.target.value })}
                      >
                        {expenseCategories.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                      <input
                        aria-label={`${rule.name} amount`}
                        inputMode="decimal"
                        type="number"
                        placeholder="0"
                        value={numericInputValue(rule.amount)}
                        onFocus={numericFieldFocus}
                        onChange={(event) => updateRecurringRule(rule.id, { amount: event.target.value })}
                      />
                      <select
                        aria-label={`${rule.name} frequency`}
                        value={rule.frequency}
                        onChange={(event) => updateRecurringRule(rule.id, { frequency: event.target.value })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                      <input
                        aria-label={`${rule.name} due day`}
                        inputMode="numeric"
                        max={rule.frequency === "weekly" ? "6" : "31"}
                        min="1"
                        type="number"
                        placeholder="1"
                        value={numericInputValue(rule.dueDay)}
                        onFocus={numericFieldFocus}
                        onChange={(event) => updateRecurringRule(rule.id, { dueDay: event.target.value })}
                      />
                      <span>
                        {nextDue.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {getDaysUntil(nextDue, today)}d
                      </span>
                      <button aria-label={`Delete ${rule.name}`} className="transaction-delete" onClick={() => deleteRecurringRule(rule.id)} type="button">
                        <Trash2 size={13} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {plannerTab === "insights" && (
            <div className="planner-panel insight-panel" role="tabpanel">
              {analytics.insightCards.map((card) => (
                <article className={card.tone} key={card.title}>
                  <span>{card.label}</span>
                  <strong>{card.title}</strong>
                  <p>{card.copy}</p>
                </article>
              ))}
            </div>
          )}

          {plannerTab === "review" && (
            <div className="planner-panel review-panel" role="tabpanel">
              <article>
                <span className="section-label">End-of-month review</span>
                <strong>{analytics.review.headline}</strong>
                <p>{analytics.review.copy}</p>
              </article>
              <div className="review-grid">
                <div>
                  <span>Biggest category</span>
                  <b>{analytics.review.biggestCategory}</b>
                </div>
                <div>
                  <span>Overspend</span>
                  <b>₹{formatMoney(analytics.overspend)}</b>
                </div>
                <div>
                  <span>Target trend</span>
                  <b>{analytics.trend.label}</b>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="analytics-grid">
          <article className="chart-card glass">
            <div className="card-heading">
              <div>
                <span className="section-label">{analytics.periodLabel} velocity</span>
                <h3>{periodTab === "yearly" ? "Monthly burn history" : `${analytics.periodLabel} burn profile`}</h3>
              </div>
              <button className="chart-expand-button" onClick={() => setGraphModal("velocity")} type="button">
                <TrendingUp size={16} />
                <span>Expand</span>
                <ChevronDown size={15} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.velocity} margin={{ left: 0, right: 8, top: 12, bottom: 2 }}>
                <defs>
                  <linearGradient id="burnGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#B77954" stopOpacity={0.46} />
                    <stop offset="85%" stopColor="#B77954" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EAE7DC" strokeDasharray="4 7" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace" }} />
                <YAxis
                  tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace" }}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,.86)",
                    border: "1px solid #EAE7DC",
                    borderRadius: 8,
                    color: "#2B2D42",
                  }}
                  formatter={(value) => [`₹${formatMoney(value)}`, "Burn"]}
                />
                <ReferenceLine
                  y={analytics.chartTarget}
                  stroke="#2B2D42"
                  strokeDasharray="6 6"
                  strokeOpacity={0.42}
                  label={{
                    value: `Target ₹${formatMoney(analytics.chartTarget)}`,
                    position: "insideTopRight",
                    fill: "#2B2D42",
                    fontFamily: "JetBrains Mono, Fira Code, ui-monospace",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="burn"
                  stroke="#9D6242"
                  strokeWidth={3}
                  fill="url(#burnGradient)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="chart-diagnostics">
              <span>Target ₹{formatMoney(analytics.chartTarget)}</span>
              <span>{analytics.chartReadout.varianceLabel}</span>
              <span>{analytics.trend.copy}</span>
            </div>
          </article>

          <article className="pie-card glass">
            <div className="card-heading">
              <div>
                <span className="section-label">Category spends</span>
                <h3>{periodTab === "yearly" ? "Monthly category mix" : "Where the money went"}</h3>
              </div>
              <button className="chart-expand-button" onClick={() => setGraphModal("categories")} type="button">
                <Banknote size={16} />
                <span>Expand</span>
                <ChevronDown size={15} />
              </button>
            </div>
            {periodTab === "yearly" ? (
              <>
                <div className="stacked-chart">
                  {analytics.yearlyCategoryKeys.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.yearlyCategorySeries} margin={{ left: 0, right: 8, top: 12, bottom: 2 }}>
                        <CartesianGrid stroke="#EAE7DC" strokeDasharray="4 7" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace", fontSize: 11 }} />
                        <YAxis
                          tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value)}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace", fontSize: 11 }}
                          width={42}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255,255,255,.9)",
                            border: "1px solid #EAE7DC",
                            borderRadius: 8,
                            color: "#2B2D42",
                          }}
                          formatter={(value, name) => [`₹${formatMoney(value)}`, name]}
                        />
                        {analytics.yearlyCategoryKeys.map((name) => (
                          <Bar dataKey={name} fill={CATEGORY_COLORS[name] || "#8D99AE"} key={name} stackId="category" radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-detail">No category spends found this year</div>
                  )}
                </div>
                <div className="stacked-legend">
                  {analytics.yearlyCategoryKeys.map((name) => (
                    <span key={name} style={{ "--dot": CATEGORY_COLORS[name] || "#8D99AE" }}>
                      {name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
            <div className="pie-layout">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categorySpends}
                    dataKey="value"
                    innerRadius="54%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="#FDFCF0"
                    strokeWidth={2}
                  >
                    {analytics.categorySpends.map((slice) => (
                      <Cell fill={slice.color} key={slice.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,.9)",
                      border: "1px solid #EAE7DC",
                      borderRadius: 8,
                      color: "#2B2D42",
                    }}
                    formatter={(value) => [`₹${formatMoney(value)}`, "Spend"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend">
              {analytics.categorySpends.map((slice) => (
                <div className="pie-line" key={slice.name}>
                  <span style={{ "--dot": slice.color }}>{slice.name}</span>
                  <b>₹{formatMoney(slice.value)}</b>
                </div>
              ))}
            </div>
              </>
            )}
          </article>

          <article className="allocation-card glass">
            <div className="card-heading">
              <div>
                <span className="section-label">{allocationTargets.needs} / {allocationTargets.wants} / {allocationTargets.savings} tracker</span>
                <h3>Actual allocation</h3>
              </div>
              <button className="chart-expand-button" onClick={() => setGraphModal("allocations")} type="button">
                <Target size={16} />
                <span>Expand</span>
                <ChevronDown size={15} />
              </button>
            </div>
            {periodTab === "yearly" ? (
              <>
                <div className="stacked-chart allocation-stacked-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.yearlyAllocationSeries} margin={{ left: 0, right: 8, top: 12, bottom: 2 }}>
                      <CartesianGrid stroke="#EAE7DC" strokeDasharray="4 7" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace", fontSize: 11 }} />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace", fontSize: 11 }}
                        width={42}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,.9)",
                          border: "1px solid #EAE7DC",
                          borderRadius: 8,
                          color: "#2B2D42",
                        }}
                        formatter={(value, name) => [`${value}%`, String(name).replace(/^\w/, (letter) => letter.toUpperCase())]}
                      />
                      <ReferenceLine y={allocationTargets.needs} stroke="#2B2D42" strokeDasharray="5 5" strokeOpacity={0.28} />
                      <Bar dataKey="needs" fill="#C9B99E" stackId="allocation" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="wants" fill="#B77954" stackId="allocation" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="savings" fill="#6F8F78" stackId="allocation" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="allocation-legend yearly-allocation-legend">
                  <AllocationLine label="Needs" target={`${allocationTargets.needs}%`} value={analytics.allocations.needs} />
                  <AllocationLine label="Wants" target={`${allocationTargets.wants}%`} value={analytics.allocations.wants} />
                  <AllocationLine label="Savings" target={`${allocationTargets.savings}%`} value={analytics.allocations.savings} />
                </div>
              </>
            ) : (
              <>
            <div className="allocation-bar" aria-label="Actual needs wants savings split">
              <span className="needs" style={{ width: `${analytics.allocations.needs}%` }} />
              <span className="wants" style={{ width: `${analytics.allocations.wants}%` }} />
              <span className="savings" style={{ width: `${analytics.allocations.savings}%` }} />
            </div>

            <div className="allocation-legend">
              <AllocationLine label="Needs" target={`${allocationTargets.needs}%`} value={analytics.allocations.needs} />
              <AllocationLine label="Wants" target={`${allocationTargets.wants}%`} value={analytics.allocations.wants} />
              <AllocationLine label="Savings" target={`${allocationTargets.savings}%`} value={analytics.allocations.savings} />
            </div>
              </>
            )}

            <div className="asset-note">
              <div className="detail-tabs" role="tablist" aria-label="Financial detail view">
                <button
                  aria-selected={detailTab === "accounts"}
                  className={`detail-tab ${detailTab === "accounts" ? "is-active" : ""}`}
                  onClick={() => setDetailTab("accounts")}
                  role="tab"
                  type="button"
                >
                  Accounts
                </button>
                <button
                  aria-selected={detailTab === "income"}
                  className={`detail-tab ${detailTab === "income" ? "is-active" : ""}`}
                  onClick={() => setDetailTab("income")}
                  role="tab"
                  type="button"
                >
                  Income
                </button>
              </div>

              {detailTab === "accounts" && (
                <div className="account-register" role="tabpanel">
                  {accounts.map((account) => (
                    <div className="account-line editable-account-line" key={account.id}>
                      <label>
                        <Landmark size={13} />
                        <EditableText value={account.name} onCommit={(nextName) => updateAccountField(account.id, { name: nextName.trim() || account.name }, "account name")} />
                      </label>
                      <select
                        aria-label={`${account.name} type`}
                        value={account.type}
                        onChange={(event) => updateAccountField(account.id, { type: event.target.value }, `${account.name} type`)}
                      >
                        <option>Bank</option>
                        <option>Market</option>
                        <option>Cash</option>
                        <option>Real Estate</option>
                        <option>Other</option>
                      </select>
                      <EditableNumber
                        aria-label={`${account.name} balance`}
                        value={account.balance}
                        onCommit={(nextBalance) => updateAccountField(account.id, { balance: nextBalance }, `${account.name} balance`)}
                      />
                    </div>
                  ))}
                  <div className="account-line account-add-line">
                    {addingAccount ? (
                      <>
                        <input
                          autoFocus
                          aria-label="New account"
                          placeholder="New account"
                          value={newAccountDraft}
                          onChange={(event) => setNewAccountDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addAccount();
                            }
                            if (event.key === "Escape") {
                              setAddingAccount(false);
                              setNewAccountDraft("");
                              setNewAccountType("Bank");
                            }
                          }}
                        />
                        <select aria-label="New account type" value={newAccountType} onChange={(event) => setNewAccountType(event.target.value)}>
                          <option>Bank</option>
                          <option>Market</option>
                          <option>Cash</option>
                          <option>Real Estate</option>
                          <option>Other</option>
                        </select>
                        <button aria-label="Save account" className="token-action-button" onClick={addAccount} type="button">
                          <Check size={14} />
                        </button>
                        <button
                          aria-label="Cancel account"
                          className="token-action-button"
                          onClick={() => {
                            setAddingAccount(false);
                            setNewAccountDraft("");
                            setNewAccountType("Bank");
                          }}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button className="account-section-add" onClick={() => setAddingAccount(true)} type="button">
                        <Plus size={14} />
                        <span>Add account</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {detailTab === "income" && (
                <div className="account-register" role="tabpanel">
                  {incomeEntries.length ? (
                    incomeEntries.slice(0, 6).map((entry) => (
                      <div className="account-line income-line" key={entry.id}>
                        <span>
                          <PiggyBank size={13} />
                          {entry.category}
                        </span>
                        <b>+₹{formatMoney(entry.amount)}</b>
                      </div>
                    ))
                  ) : (
                    <div className="empty-detail">No income logged yet</div>
                  )}
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="investment-summary glass">
          <div className="investment-copy">
            <span className="section-label">Portfolio pulse</span>
            <strong>₹{formatMoney(analytics.portfolioTotal)}</strong>
            <p>
              Market exposure is {analytics.marketShare}% with ₹{formatMoney(analytics.liquidityTotal)} available across liquid accounts.
            </p>
          </div>

          <div className="investment-radar" aria-hidden="true">
            <span className="radar-core">₹</span>
            <i className="radar-ring ring-one" />
            <i className="radar-ring ring-two" />
          </div>

          <div className="investment-actions">
            <div className="investment-chip-row">
              <span>Stocks ₹{formatMoney(assets.stocks)}</span>
              <span>MF ₹{formatMoney(assets.mutualFunds)}</span>
            </div>
            <div className="investment-button-row">
              <button className="portfolio-action" onClick={() => setSyncOpen(true)} type="button">
                <RefreshCw size={16} />
                <span>Revalue</span>
              </button>
              <button className="portfolio-action is-dark" onClick={() => setPeriodTab("monthly")} type="button">
                <TrendingUp size={16} />
                <span>Monthly</span>
              </button>
            </div>
          </div>
        </section>
      </section>

      <nav className="mobile-shell-nav" aria-label="Mobile workspace pages">
        <button className={mobilePage === "log" ? "is-active" : ""} onClick={() => setMobilePage("log")} type="button">
          <Send size={16} />
          <span>Log</span>
        </button>
        <button className={mobilePage === "dashboard" ? "is-active" : ""} onClick={() => setMobilePage("dashboard")} type="button">
          <TrendingUp size={16} />
          <span>Dashboard</span>
        </button>
      </nav>

      {syncOpen && (
        <div className="modal-layer" role="presentation">
          <form className="asset-sheet glass" onSubmit={saveAssets}>
            <div className="sheet-header">
              <div>
                <span className="section-label">Weekly portfolio asset sync</span>
                <h3>Override valuation cells</h3>
              </div>
              <button aria-label="Close asset sync" className="icon-button" type="button" onClick={() => setSyncOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="asset-input">
              <span>Mutual Funds · C16</span>
              <input
                inputMode="decimal"
                type="number"
                value={draftAssets.mutualFunds}
                onChange={(event) => setDraftAssets((current) => ({ ...current, mutualFunds: event.target.value }))}
              />
            </label>

            <label className="asset-input">
              <span>Stocks · C17</span>
              <input
                inputMode="decimal"
                type="number"
                value={draftAssets.stocks}
                onChange={(event) => setDraftAssets((current) => ({ ...current, stocks: event.target.value }))}
              />
            </label>

            <button className="submit-button" type="submit">
              {busy ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
              <span>Sync valuations</span>
            </button>
          </form>
        </div>
      )}

      {activeGraphDetail && (
        <div className="modal-layer graph-modal-layer" role="presentation">
          <section aria-label={activeGraphDetail.title} className="graph-detail-sheet glass" role="dialog">
            <div className="sheet-header">
              <div>
                <span className="section-label">{activeGraphDetail.eyebrow}</span>
                <h3>{activeGraphDetail.title}</h3>
              </div>
              <button aria-label="Close graph detail" className="icon-button" type="button" onClick={() => setGraphModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="graph-detail-summary">
              <div>
                <span>Total shown</span>
                <b>₹{formatMoney(activeGraphDetail.total)}</b>
              </div>
              <div>
                <span>{activeGraphDetail.targetLabel}</span>
                <b>{activeGraphDetail.targetValue}</b>
              </div>
              <div>
                <span>Status</span>
                <b>{activeGraphDetail.status}</b>
              </div>
            </div>

            {activeGraphDetail.chartMode === "yearlyCategories" ? (
              <div className="graph-trend-panel">
                <div className="graph-trend-chart">
                  {activeGraphDetail.keys.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeGraphDetail.data} margin={{ left: 0, right: 8, top: 14, bottom: 2 }}>
                        <CartesianGrid stroke="#EAE7DC" strokeDasharray="4 7" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace" }} />
                        <YAxis
                          tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value)}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace" }}
                          width={54}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255,255,255,.9)",
                            border: "1px solid #EAE7DC",
                            borderRadius: 8,
                            color: "#2B2D42",
                          }}
                          formatter={(value, name) => [`₹${formatMoney(value)}`, name]}
                        />
                        {activeGraphDetail.keys.map((name) => (
                          <Area
                            dataKey={name}
                            fill={CATEGORY_COLORS[name] || "#8D99AE"}
                            fillOpacity={0.32}
                            key={name}
                            stackId="categoryTrend"
                            stroke={CATEGORY_COLORS[name] || "#8D99AE"}
                            strokeWidth={2}
                            type="monotone"
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-detail">No category spends found this year</div>
                  )}
                </div>
                <div className="stacked-legend graph-trend-legend">
                  {activeGraphDetail.keys.map((name) => (
                    <span key={name} style={{ "--dot": CATEGORY_COLORS[name] || "#8D99AE" }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ) : activeGraphDetail.chartMode === "yearlyAllocations" ? (
              <div className="graph-trend-panel">
                <div className="graph-trend-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeGraphDetail.data} margin={{ left: 0, right: 12, top: 14, bottom: 2 }}>
                      <CartesianGrid stroke="#EAE7DC" strokeDasharray="4 7" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace" }} />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#2B2D42", fontFamily: "JetBrains Mono, Fira Code, ui-monospace" }}
                        width={54}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,.9)",
                          border: "1px solid #EAE7DC",
                          borderRadius: 8,
                          color: "#2B2D42",
                        }}
                        formatter={(value, name) => [`${value}%`, String(name).replace(/^\w/, (letter) => letter.toUpperCase())]}
                      />
                      <ReferenceLine y={analytics.allocationTargets.needs} stroke="#C9B99E" strokeDasharray="5 5" strokeOpacity={0.44} />
                      <ReferenceLine y={analytics.allocationTargets.wants} stroke="#B77954" strokeDasharray="5 5" strokeOpacity={0.44} />
                      <ReferenceLine y={analytics.allocationTargets.savings} stroke="#6F8F78" strokeDasharray="5 5" strokeOpacity={0.44} />
                      <Line dataKey="needs" dot={{ r: 3 }} stroke="#C9B99E" strokeWidth={3} type="monotone" />
                      <Line dataKey="wants" dot={{ r: 3 }} stroke="#B77954" strokeWidth={3} type="monotone" />
                      <Line dataKey="savings" dot={{ r: 3 }} stroke="#6F8F78" strokeWidth={3} type="monotone" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="stacked-legend graph-trend-legend">
                  <span style={{ "--dot": "#C9B99E" }}>Needs target {analytics.allocationTargets.needs}%</span>
                  <span style={{ "--dot": "#B77954" }}>Wants target {analytics.allocationTargets.wants}%</span>
                  <span style={{ "--dot": "#6F8F78" }}>Savings target {analytics.allocationTargets.savings}%</span>
                </div>
              </div>
            ) : (
              <div className="graph-detail-list no-scrollbar">
              {activeGraphDetail.groups.length ? (
                activeGraphDetail.groups.map((group) => (
                  <article className="graph-detail-group" key={group.name}>
                    <div className="graph-group-header">
                      <div>
                        <span>{group.name}</span>
                        <b>₹{formatMoney(group.value)}</b>
                      </div>
                      <small>{group.logs.length} entries</small>
                    </div>

                    {group.categories?.length > 0 && (
                      <div className="graph-category-strip">
                        {group.categories.map((item) => (
                          <span key={item.name}>
                            {item.name} · ₹{formatMoney(item.value)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="graph-log-list">
                      {group.logs.slice(0, 12).map((entry) => (
                        <div className="graph-log-row" key={entry.id}>
                          <div>
                            <span>{entry.category}</span>
                            <small>{entry.dateLabel} · {entry.accountName}</small>
                            {entry.note && <p>{entry.note}</p>}
                          </div>
                          <b>₹{formatMoney(entry.amount)}</b>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-detail">No spends found for this view</div>
              )}
            </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function normalizeAssets(assets) {
  return {
    mutualFunds: Number(assets.mutualFunds || assets.mf || assets.mfVal || assets.C16 || 0),
    stocks: Number(assets.stocks || assets.stocksVal || assets.C17 || 0),
  };
}

function normalizeAccounts(accounts) {
  const seen = new Set();
  return accounts
    .map((account, index) => ({
      id: account.id || account.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `account-${index}`,
      name: account.name || `Account ${index + 1}`,
      type: account.type || "Other",
      balance: Number(account.balance || account.value || 0),
      updatedAt: account.updatedAt,
    }))
    .filter((account) => {
      if (!account.id || seen.has(account.id)) return false;
      seen.add(account.id);
      return true;
    });
}

function getAccountName(accounts, accountId) {
  return accounts.find((account) => account.id === accountId)?.name || "Unassigned";
}

function getJournalMonthValue(transaction) {
  const year = Number(transaction.year || 0);
  const month = Number(transaction.monthNumber || 0);
  if (!year || !month) return "";
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildJournalOptions(transactions, expenseCategories, incomeSources) {
  const categories = [...new Set([...expenseCategories, ...incomeSources, ...transactions.map((transaction) => transaction.category).filter(Boolean)])].sort();
  const monthMap = new Map();
  const weeks = new Set();

  transactions.forEach((transaction) => {
    const monthValue = getJournalMonthValue(transaction);
    if (monthValue && !monthMap.has(monthValue)) {
      monthMap.set(monthValue, transaction.monthString || monthValue);
    }
    if (transaction.weekOfMonth) weeks.add(String(transaction.weekOfMonth));
  });

  return {
    categories,
    months: [...monthMap.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value)),
    weeks: [...weeks].sort((a, b) => Number(a) - Number(b)),
  };
}

function buildDashboardMonthOptions(transactions) {
  const monthMap = new Map();
  const now = new Date();
  const currentYear = now.getFullYear();
  MONTH_SHORT_LABELS.forEach((_, index) => {
    const monthDate = new Date(currentYear, index, 1);
    monthMap.set(getMonthInputValue(monthDate), monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
  });

  transactions.forEach((transaction) => {
    const monthValue = getJournalMonthValue(transaction);
    if (!monthValue || monthMap.has(monthValue)) return;
    const [year, month] = monthValue.split("-").map(Number);
    const labelDate = new Date(year, month - 1, 1);
    monthMap.set(
      monthValue,
      Number.isNaN(labelDate.getTime())
        ? transaction.monthString || monthValue
        : labelDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    );
  });

  return [...monthMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value.localeCompare(a.value));
}

function filterJournalEntries(transactions, filters) {
  const spendFilter = JOURNAL_SPEND_FILTERS.find((item) => item.id === filters.spend);
  return transactions.filter((transaction) => {
    if (filters.category !== "all" && transaction.category !== filters.category) return false;
    if (filters.direction !== "all" && transaction.direction !== filters.direction) return false;
    if (filters.month !== "all" && getJournalMonthValue(transaction) !== filters.month) return false;
    if (filters.week !== "all" && String(transaction.weekOfMonth || "") !== filters.week) return false;
    if (filters.noteMode === "with" && !transaction.note) return false;
    if (filters.noteMode === "without" && transaction.note) return false;
    if (spendFilter && spendFilter.id !== "all") {
      const amount = Number(transaction.amount || 0);
      if (spendFilter.min !== undefined && amount < spendFilter.min) return false;
      if (spendFilter.max !== undefined && amount > spendFilter.max) return false;
    }
    return true;
  });
}

function normalizeMetrics(data) {
  const hasMetrics = ["totalBurn", "savingsRate", "unplanned"].some((key) => data[key] !== undefined);
  if (!hasMetrics) return null;
  return {
    totalBurn: Number(data.totalBurn || 0),
    savingsRate: Number(data.savingsRate || 0),
    unplanned: Number(data.unplanned || 0),
  };
}

function buildAnalytics(transactions, accounts, assets, remoteMetrics, period, categories, budgets, recurringRules, allocationTargets = DEFAULT_ALLOCATION_TARGETS, anchorDate = new Date()) {
  const now = new Date(anchorDate);
  if (Number.isNaN(now.getTime())) now.setTime(Date.now());
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentWeek = getWeekOfMonth(now);
  const expenseTransactions = transactions.filter(isBurnTransaction).map((transaction) => ({ ...transaction, amount: getBurnAmount(transaction) }));
  const allocationTransactions = transactions.map(toAllocationTransaction).filter(Boolean);
  const monthlyIncomeTransactions = transactions.filter(
    (transaction) => transaction.direction === "income" && Number(transaction.monthNumber || 0) === currentMonth && Number(transaction.year || 0) === currentYear,
  );
  const monthlyExpenseTransactions = expenseTransactions.filter(
    (transaction) => Number(transaction.monthNumber || 0) === currentMonth && Number(transaction.year || 0) === currentYear,
  );
  const matchesMetricPeriod = (transaction) => {
    const transactionYear = Number(transaction.year || 0);
    const transactionMonth = Number(transaction.monthNumber || 0);
    const transactionWeek = Number(transaction.weekOfMonth || 1);
    if (period === "yearly") return transactionYear === currentYear;
    if (period === "weekly") return transactionYear === currentYear && transactionMonth === currentMonth && transactionWeek === currentWeek;
    return transactionYear === currentYear && transactionMonth === currentMonth;
  };
  const metricExpenseTransactions = expenseTransactions.filter((transaction) => {
    return matchesMetricPeriod(transaction);
  });
  const metricIncomeTransactions = transactions.filter((transaction) => {
    if (transaction.direction !== "income") return false;
    return matchesMetricPeriod(transaction);
  });
  const chartExpenseTransactions = filterVelocityTransactions(expenseTransactions, period, now);
  const chartAllocationTransactions = filterVelocityTransactions(allocationTransactions, period, now);
  const chartIncomeTransactions = filterVelocityTransactions(
    transactions.filter((transaction) => transaction.direction === "income"),
    period,
    now,
  );
  const metricBudgetTarget =
    period === "weekly"
      ? Math.round(Number(budgets.monthlyTotal || 0) / 4)
      : Number(budgets.monthlyTotal || 0) * (period === "yearly" ? now.getMonth() + 1 : 1);
  const burnTotals = getBucketTotals(metricExpenseTransactions);
  const total = Object.values(burnTotals).reduce((sum, value) => sum + Number(value || 0), 0);
  const monthlyIncome = monthlyIncomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const metricIncome = metricIncomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const chartTotals = getBucketTotals(chartAllocationTransactions);
  const chartTotal = Object.values(chartTotals).reduce((sum, value) => sum + Number(value || 0), 0);
  const chartIncome = chartIncomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const chartAllocationBase = chartIncome || chartTotal;
  const allocationBase = metricIncome || total;
  const computedTotalBurn = total;
  const computedSavingsRate = chartAllocationBase ? Math.max(0, Math.round((chartTotals.savings / chartAllocationBase) * 100)) : 0;
  const computedUnplanned = Math.max(0, chartTotals.wants - chartAllocationBase * ((allocationTargets.wants || DEFAULT_ALLOCATION_TARGETS.wants) / 100));
  const totalBurn = computedTotalBurn;
  const savingsRate = computedSavingsRate;
  const unplanned = computedUnplanned;
  const allocations = {
    needs: chartAllocationBase ? Math.max(0, Math.round((chartTotals.needs / chartAllocationBase) * 100)) : 0,
    wants: chartAllocationBase ? Math.max(0, Math.round((chartTotals.wants / chartAllocationBase) * 100)) : 0,
    savings: chartAllocationBase ? Math.max(0, Math.round((chartTotals.savings / chartAllocationBase) * 100)) : 0,
  };
  const velocity = buildVelocity(expenseTransactions, period, now);
  const chartTarget =
    period === "monthly"
      ? Math.round(Number(budgets.monthlyTotal || 0) / 4)
      : period === "yearly"
        ? Number(budgets.monthlyTotal || 0)
        : Number(budgets.monthlyTotal || 0);
  const latestBurnPoint = [...velocity].reverse().find((point) => Number(point.burn || 0) > 0) || velocity[velocity.length - 1] || { label: "Now", burn: 0 };
  const chartVariance = Number(latestBurnPoint.burn || 0) - chartTarget;
  const chartReadout = {
    targetCopy:
      period === "weekly"
        ? "The dotted line is one quarter of the monthly budget, used as a week-by-week pacing target."
        : period === "monthly"
          ? "The dotted line is one quarter of the monthly budget, used as a W1-W4 pacing target."
        : period === "yearly"
          ? "The dotted line is the monthly budget target, repeated across the year so each month can be compared cleanly."
          : "The dotted line is the monthly budget target.",
    varianceLabel: chartVariance > 0 ? `Over ₹${formatMoney(chartVariance)}` : `Behind ₹${formatMoney(Math.abs(chartVariance))}`,
    varianceCopy:
      chartVariance > 0
        ? `${latestBurnPoint.label} is above the target line at the current stage.`
        : `${latestBurnPoint.label} is still below the target line at the current stage.`,
  };
  const categoryNames = [...new Set([...categories, ...expenseTransactions.map((transaction) => transaction.category).filter(Boolean)])];
  const categoryProgress = categoryNames.map((name) => {
    const spent = Math.max(0, monthlyExpenseTransactions
      .filter((transaction) => transaction.category === name)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
    const limit = Number(budgets.categories[name] ?? getDefaultCategoryBudget(name));
    const percent = limit ? Math.round((spent / limit) * 100) : 0;
    const status = percent >= 100 ? "danger" : percent >= 80 ? "warn" : "calm";
    return {
      name,
      spent,
      limit,
      percent,
      status,
      remaining: Math.max(0, limit - spent),
      color: CATEGORY_COLORS[name] || "#8D99AE",
    };
  });
  const categorySpends = categoryProgress
    .map((slice) => ({
      name: slice.name,
      color: slice.color,
      value: chartExpenseTransactions
        .filter((transaction) => transaction.category === slice.name)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    }))
    .filter((slice) => slice.value > 0);
  const yearlyCategory = buildYearlyCategorySeries(expenseTransactions, categoryNames, now);
  const yearlyAllocationSeries = buildYearlyAllocationSeries(allocationTransactions, now);
  const graphDetails = buildGraphDetails(expenseTransactions, chartExpenseTransactions, chartAllocationTransactions, accounts, period, now);
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const displayLabel = period === "yearly" ? String(now.getFullYear()) : monthLabel;
  const monthlyBudgetSpent = categoryProgress.reduce((sum, item) => sum + item.spent, 0);
  const overspend = Math.max(0, monthlyBudgetSpent - Number(budgets.monthlyTotal || 0));
  const budgetRemaining = Math.max(0, metricBudgetTarget - monthlyBudgetSpent);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedBurn = now.getDate() ? Math.round((monthlyBudgetSpent / now.getDate()) * daysInMonth) : monthlyBudgetSpent;
  const forecast = {
    projectedBurn,
    projectedOverspend: Math.max(0, projectedBurn - Number(budgets.monthlyTotal || 0)),
    pace: budgets.monthlyTotal ? Math.round((projectedBurn / budgets.monthlyTotal) * 100) : 0,
  };
  const recurringMonthlyLoad = recurringRules.reduce((sum, rule) => sum + Number(rule.amount || 0) * (rule.frequency === "weekly" ? 4 : 1), 0);
  const nextRecurring = recurringRules
    .map((rule) => {
      const nextDue = getNextDueDate(rule, now);
      return { ...rule, nextDue, daysUntil: getDaysUntil(nextDue, now) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
  const nonZeroVelocity = velocity.filter((point) => point.burn > 0);
  const currentPoint = nonZeroVelocity[nonZeroVelocity.length - 1] || { label: "Now", burn: 0 };
  const previousPoint = nonZeroVelocity[nonZeroVelocity.length - 2] || { label: "Prior", burn: currentPoint.burn };
  const trendDelta = currentPoint.burn - previousPoint.burn;
  const trend = {
    label: trendDelta > 0 ? "Rising" : trendDelta < 0 ? "Cooling" : "Flat",
    copy:
      trendDelta > 0
        ? `${currentPoint.label} is ₹${formatMoney(Math.abs(trendDelta))} above ${previousPoint.label}.`
        : trendDelta < 0
          ? `${currentPoint.label} is ₹${formatMoney(Math.abs(trendDelta))} below ${previousPoint.label}.`
          : `${currentPoint.label} is tracking level with ${previousPoint.label}.`,
  };
  const biggest = [...categoryProgress].sort((a, b) => b.spent - a.spent)[0] || { name: "No spends", spent: 0, percent: 0 };
  const review = {
    headline: overspend
      ? `Budget exceeded by ₹${formatMoney(overspend)}`
      : forecast.projectedOverspend
        ? `Forecast risk: ₹${formatMoney(forecast.projectedOverspend)} over target`
        : "Month is inside the command limit",
    copy: `${biggest.name} is the largest category at ₹${formatMoney(biggest.spent)}. Recurring commitments represent ₹${formatMoney(recurringMonthlyLoad)} of planned monthly load.`,
    biggestCategory: biggest.name,
  };
  const portfolioTotal = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const marketAccounts = accounts.filter((account) => account.type === "Market");
  const marketTotal = marketAccounts.length
    ? marketAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
    : Number(assets.mutualFunds || 0) + Number(assets.stocks || 0);
  const liquidityTotal = Math.max(0, portfolioTotal - marketTotal);
  const marketShare = portfolioTotal ? Math.round((marketTotal / portfolioTotal) * 100) : 0;
  const insightCards = [
    {
      label: "Forecast",
      title: `Projected close ₹${formatMoney(forecast.projectedBurn)}`,
      copy: forecast.projectedOverspend
        ? `Current pace is ${forecast.pace}% of target and may exceed the monthly limit by ₹${formatMoney(forecast.projectedOverspend)}.`
        : `Current pace is ${forecast.pace}% of target with ₹${formatMoney(budgetRemaining)} still available.`,
      tone: forecast.projectedOverspend ? "is-warning" : "is-calm",
    },
    {
      label: "Targets",
      title: overspend ? `Overspent by ₹${formatMoney(overspend)}` : "Targets still intact",
      copy: `${biggest.name} is at ${biggest.percent}% of its category limit. Use the category bars to rebalance before the month closes.`,
      tone: overspend || biggest.percent >= 100 ? "is-danger" : "is-calm",
    },
    {
      label: "Recurring",
      title: nextRecurring[0] ? `${nextRecurring[0].name} due in ${nextRecurring[0].daysUntil}d` : "No reminders set",
      copy: nextRecurring[0]
        ? `Next scheduled outlay is ₹${formatMoney(nextRecurring[0].amount)} on ${nextRecurring[0].nextDue.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
        : "Add rent, SIPs, bills, and weekly repeats to make the forecast sharper.",
      tone: "is-neutral",
    },
  ];
  let alertTitle = "Context intelligence";
  let alertCopy = `Tracked accounts hold ₹${formatMoney(portfolioTotal)} with market assets at ₹${formatMoney(marketTotal)}. Expense burn excludes income credits.`;
  if (allocations.wants > allocationTargets.wants) {
    alertTitle = "Wants allocation drift";
    alertCopy = `Wants are running at ${allocations.wants}% against a ${allocationTargets.wants}% target. Life enjoyment, care, and subscription entries are creating the visible variance.`;
  } else if (savingsRate < allocationTargets.savings) {
    alertTitle = "Savings rate compression";
    alertCopy = `Savings are at ${savingsRate}%, below the ${allocationTargets.savings}% marker. Logging an investment entry will rebalance the month.`;
  } else if (forecast.projectedOverspend > 0) {
    alertTitle = "Forecast limit breach";
    alertCopy = `At this pace, the month may close ₹${formatMoney(forecast.projectedOverspend)} above the budget target.`;
  }
  return {
    allocations,
    allocationBase,
    allocationTargets,
    alertCopy,
    alertTitle,
    budgetRemaining,
    categoryProgress,
    categorySpends,
    chartReadout,
    chartTarget,
    chartVariance,
    displayLabel,
    forecast,
    graphDetails,
    insightCards,
    liquidityTotal,
    marketShare,
    marketTotal,
    monthLabel,
    monthlyIncome,
    monthlyBudgetSpent,
    nextRecurring,
    overspend,
    periodLabel: PERIOD_TABS.find((tab) => tab.id === period)?.label || "Monthly",
    portfolioTotal,
    recurringMonthlyLoad,
    review,
    savingsRate,
    totalBurn,
    trend,
    unplanned,
    velocity,
    yearlyAllocationSeries,
    yearlyCategoryKeys: yearlyCategory.keys,
    yearlyCategorySeries: yearlyCategory.series,
  };
}

function buildAnalyticsLegacy(transactions, accounts, assets, remoteMetrics, period, categories) {
  const expenseTransactions = transactions.filter(isBurnTransaction).map((transaction) => ({ ...transaction, amount: getBurnAmount(transaction) }));
  const totals = transactions.reduce(
    (memo, transaction) => {
      if (!isBurnTransaction(transaction)) return memo;
      const key = transaction.bucket.toLowerCase();
      if (memo[key] === undefined) memo[key] = 0;
      memo[key] += getBurnAmount(transaction);
      return memo;
    },
    { needs: 0, wants: 0, savings: 0 },
  );
  const total = Math.max(0, Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0));
  const computedTotalBurn = total;
  const computedSavingsRate = total ? Math.round((totals.savings / total) * 100) : 0;
  const wantTarget = total * 0.3;
  const computedUnplanned = Math.max(0, totals.wants - wantTarget);
  const totalBurn = computedTotalBurn;
  const savingsRate = remoteMetrics?.savingsRate ?? computedSavingsRate;
  const unplanned = remoteMetrics?.unplanned ?? computedUnplanned;
  const allocations = {
    needs: total ? Math.round((totals.needs / total) * 100) : 0,
    wants: total ? Math.round((totals.wants / total) * 100) : 0,
    savings: total ? Math.max(0, 100 - Math.round((totals.needs / total) * 100) - Math.round((totals.wants / total) * 100)) : 0,
  };
  const velocity = buildVelocity(expenseTransactions, period);
  const categoryNames = [...new Set([...categories, ...expenseTransactions.map((transaction) => transaction.category).filter(Boolean)])];
  const categorySpends = categoryNames.map((name) => ({
    name,
    color: CATEGORY_COLORS[name] || "#8D99AE",
    value: expenseTransactions
      .filter((transaction) => transaction.category === name)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
  })).filter((slice) => slice.value > 0);

  const latest = transactions[0] ? new Date(transactions[0].timestamp) : new Date();
  const monthLabel = latest.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const portfolioTotal = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const marketTotal =
    accounts
      .filter((account) => account.type === "Market")
      .reduce((sum, account) => sum + Number(account.balance || 0), 0) ||
    Number(assets.mutualFunds || 0) + Number(assets.stocks || 0);
  const liquidityTotal = Math.max(0, portfolioTotal - marketTotal);
  const marketShare = portfolioTotal ? Math.round((marketTotal / portfolioTotal) * 100) : 0;

  let alertTitle = "Context intelligence";
  let alertCopy = `Tracked accounts hold ₹${formatMoney(portfolioTotal)} with market assets at ₹${formatMoney(marketTotal)}. Expense burn excludes income credits.`;

  if (allocations.wants > 30) {
    alertTitle = "Wants allocation drift";
    alertCopy = `Wants are running at ${allocations.wants}% against a 30% target. Food, care, and subscription entries are creating the visible variance.`;
  } else if (savingsRate < 20) {
    alertTitle = "Savings rate compression";
    alertCopy = `Savings are at ${savingsRate}%, below the 20% marker. Logging an investment entry will rebalance the month.`;
  } else if (velocity.some((point, index, list) => index > 0 && point.burn > list[index - 1].burn * 1.7)) {
    alertTitle = "Weekly velocity spike";
    alertCopy = "A recent week rose sharply above the prior burn profile. Check utilities, commuting, or dining entries before month close.";
  }

  return {
    allocations,
    alertCopy,
    alertTitle,
    categorySpends,
    monthLabel,
    liquidityTotal,
    marketShare,
    marketTotal,
    periodLabel: PERIOD_TABS.find((tab) => tab.id === period)?.label || "Monthly",
    portfolioTotal,
    savingsRate,
    totalBurn,
    unplanned,
    velocity,
  };
}

function buildVelocity(expenseTransactions, period, anchorDate = new Date()) {
  const currentYear = anchorDate.getFullYear();
  const currentMonth = anchorDate.getMonth() + 1;
  if (period === "monthly") {
    return [1, 2, 3, 4].map((week) => ({
      label: `W${week}`,
      burn: Object.values(getBucketTotals(expenseTransactions
        .filter(
          (transaction) =>
            Number(transaction.year || 0) === currentYear &&
            Number(transaction.monthNumber || 0) === currentMonth &&
            Number(transaction.weekOfMonth || 1) === week,
        ))).reduce((sum, value) => sum + value, 0),
    }));
  }

  if (period === "yearly") {
    return MONTH_SHORT_LABELS.map((label, index) => ({
      label,
      burn: Object.values(getBucketTotals(expenseTransactions
        .filter(
          (transaction) =>
            Number(transaction.year || 0) === currentYear &&
            Number(transaction.monthNumber || 0) === index + 1,
        ))).reduce((sum, value) => sum + value, 0),
    }));
  }

  return [1, 2, 3, 4].map((week) => ({
    label: `W${week}`,
    burn: Object.values(getBucketTotals(expenseTransactions
      .filter(
        (transaction) =>
          Number(transaction.year || 0) === currentYear &&
          Number(transaction.monthNumber || 0) === currentMonth &&
          Number(transaction.weekOfMonth || 1) === week,
      ))).reduce((sum, value) => sum + value, 0),
  }));
}

function buildYearlyCategorySeries(expenseTransactions, categories, anchorDate = new Date()) {
  const currentYear = anchorDate.getFullYear();
  const categoryKeys = [...new Set([...categories, ...expenseTransactions.map((transaction) => transaction.category).filter(Boolean)])];
  const series = MONTH_SHORT_LABELS.map((label, index) => {
    const row = { label, monthNumber: index + 1 };
    categoryKeys.forEach((categoryName) => {
      row[categoryName] = 0;
    });
    return row;
  });

  expenseTransactions
    .filter((transaction) => Number(transaction.year || 0) === currentYear)
    .forEach((transaction) => {
      const monthIndex = Number(transaction.monthNumber || 0) - 1;
      if (monthIndex < 0 || monthIndex >= series.length) return;
      const categoryName = transaction.category || "Uncategorized";
      if (series[monthIndex][categoryName] === undefined) series[monthIndex][categoryName] = 0;
      series[monthIndex][categoryName] += Number(transaction.amount || 0);
    });

  const activeKeys = categoryKeys.filter((categoryName) => series.some((row) => Number(row[categoryName] || 0) > 0));
  return {
    keys: activeKeys,
    series,
  };
}

function buildYearlyAllocationSeries(allocationTransactions, anchorDate = new Date()) {
  const currentYear = anchorDate.getFullYear();
  const series = MONTH_SHORT_LABELS.map((label, index) => ({
    label,
    monthNumber: index + 1,
    needs: 0,
    wants: 0,
    savings: 0,
    needsAmount: 0,
    wantsAmount: 0,
    savingsAmount: 0,
  }));

  allocationTransactions
    .filter((transaction) => Number(transaction.year || 0) === currentYear)
    .forEach((transaction) => {
      const monthIndex = Number(transaction.monthNumber || 0) - 1;
      if (monthIndex < 0 || monthIndex >= series.length) return;
      const bucket = String(transaction.bucket || getBucket(transaction.category)).toLowerCase();
      if (!["needs", "wants", "savings"].includes(bucket)) return;
      series[monthIndex][`${bucket}Amount`] += Number(transaction.amount || 0);
    });

  return series.map((row) => {
    const total = row.needsAmount + row.wantsAmount + row.savingsAmount;
    if (!total) return row;
    return {
      ...row,
      needs: Math.round((row.needsAmount / total) * 100),
      wants: Math.round((row.wantsAmount / total) * 100),
      savings: Math.max(0, 100 - Math.round((row.needsAmount / total) * 100) - Math.round((row.wantsAmount / total) * 100)),
    };
  });
}

function getGraphDetailConfig(type, analytics, period = "monthly") {
  if (!type) return null;
  const details = analytics.graphDetails || {};
  const isYearly = period === "yearly";
  if (type === "velocity") {
    return {
      eyebrow: isYearly ? "Yearly monthly velocity" : `${analytics.periodLabel} velocity`,
      title: isYearly ? "Monthly history breakdown" : `${analytics.periodLabel} burn breakdown`,
      groups: details.velocity || [],
      status: analytics.chartReadout.varianceLabel,
      targetLabel: "Target line",
      targetValue: `₹${formatMoney(analytics.chartTarget)}`,
      total: (details.velocity || []).reduce((sum, group) => sum + Number(group.value || 0), 0),
    };
  }
  if (type === "categories") {
    const groups = details.categories || [];
    if (isYearly) {
      const total = (analytics.yearlyCategorySeries || []).reduce(
        (sum, row) => sum + (analytics.yearlyCategoryKeys || []).reduce((monthSum, key) => monthSum + Number(row[key] || 0), 0),
        0,
      );
      return {
        chartMode: "yearlyCategories",
        data: analytics.yearlyCategorySeries || [],
        eyebrow: "Category spends",
        keys: analytics.yearlyCategoryKeys || [],
        status: `${(analytics.yearlyCategoryKeys || []).length} active categories`,
        targetLabel: "View",
        targetValue: "Month by month",
        title: "Category trend by month",
        total,
      };
    }
    return {
      eyebrow: "Category spends",
      title: "Spend details by category",
      groups,
      status: `${groups.length} active categories`,
      targetLabel: "Period target",
      targetValue: `₹${formatMoney(analytics.chartTarget)}`,
      total: groups.reduce((sum, group) => sum + Number(group.value || 0), 0),
    };
  }
  if (type === "allocations") {
    const groups = details.allocations || [];
    if (isYearly) {
      const total = (analytics.yearlyAllocationSeries || []).reduce(
        (sum, row) => sum + Number(row.needsAmount || 0) + Number(row.wantsAmount || 0) + Number(row.savingsAmount || 0),
        0,
      );
      return {
        chartMode: "yearlyAllocations",
        data: analytics.yearlyAllocationSeries || [],
        eyebrow: "Needs / Wants / Savings",
        status: `${analytics.allocations.needs}/${analytics.allocations.wants}/${analytics.allocations.savings}%`,
        targetLabel: "Target split",
        targetValue: `${analytics.allocationTargets.needs}/${analytics.allocationTargets.wants}/${analytics.allocationTargets.savings}%`,
        title: "Allocation trend by month",
        total,
      };
    }
    return {
      eyebrow: "Needs / Wants / Savings",
      title: "Allocation detail",
      groups,
      status: `${analytics.allocations.needs}/${analytics.allocations.wants}/${analytics.allocations.savings}%`,
      targetLabel: "Target split",
      targetValue: `${analytics.allocationTargets.needs}/${analytics.allocationTargets.wants}/${analytics.allocationTargets.savings}%`,
      total: groups.reduce((sum, group) => sum + Number(group.value || 0), 0),
    };
  }
  return null;
}

function buildGraphDetails(expenseTransactions, metricExpenseTransactions, allocationTransactions, accounts, period, anchorDate = new Date()) {
  const velocityLabels = buildVelocity(expenseTransactions, period, anchorDate).map((point) => point.label);
  const velocityTransactions = filterVelocityTransactions(expenseTransactions, period, anchorDate);
  return {
    velocity: buildTransactionGroups(velocityTransactions, accounts, (transaction) => getVelocityGroupLabel(transaction, period), velocityLabels),
    categories: buildTransactionGroups(metricExpenseTransactions, accounts, (transaction) => transaction.category || "Uncategorized"),
    allocations: buildTransactionGroups(
      allocationTransactions,
      accounts,
      (transaction) => String(transaction.bucket || getBucket(transaction.category)),
      ["Needs", "Wants", "Savings"],
    ),
  };
}

function filterVelocityTransactions(expenseTransactions, period, anchorDate = new Date()) {
  const currentYear = anchorDate.getFullYear();
  const currentMonth = anchorDate.getMonth() + 1;
  if (period === "yearly") {
    return expenseTransactions.filter((transaction) => Number(transaction.year || 0) === currentYear);
  }
  if (period === "monthly") {
    return expenseTransactions.filter(
      (transaction) => Number(transaction.year || 0) === currentYear && Number(transaction.monthNumber || 0) === currentMonth,
    );
  }
  return expenseTransactions.filter(
    (transaction) => Number(transaction.year || 0) === currentYear && Number(transaction.monthNumber || 0) === currentMonth,
  );
}

function getVelocityGroupLabel(transaction, period) {
  if (period === "yearly") {
    const monthIndex = Number(transaction.monthNumber || 0) - 1;
    return MONTH_SHORT_LABELS[monthIndex] || transaction.monthString || "Unknown";
  }
  if (period === "monthly") {
    return `W${Number(transaction.weekOfMonth || 1)}`;
  }
  return `W${Number(transaction.weekOfMonth || 1)}`;
}

function buildTransactionGroups(transactions, accounts, getGroupName, preferredOrder = []) {
  const groups = new Map(preferredOrder.map((name) => [name, createGraphGroup(name)]));
  transactions.forEach((transaction) => {
    const groupName = getGroupName(transaction) || "Uncategorized";
    if (!groups.has(groupName)) groups.set(groupName, createGraphGroup(groupName));
    const group = groups.get(groupName);
    const log = toGraphLog(transaction, accounts);
    group.value += log.amount;
    group.logs.push(log);
    group.categoryTotals.set(log.category, (group.categoryTotals.get(log.category) || 0) + log.amount);
  });

  return [...groups.values()]
    .filter((group) => group.value > 0)
    .map((group) => ({
      name: group.name,
      value: group.value,
      logs: group.logs.sort((a, b) => b.sortTime - a.sortTime),
      categories: [...group.categoryTotals.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    }));
}

function createGraphGroup(name) {
  return {
    name,
    value: 0,
    logs: [],
    categoryTotals: new Map(),
  };
}

function toGraphLog(transaction, accounts) {
  const sortDate = new Date(transaction.timestamp || transaction.date || 0);
  const dateLabel = Number.isNaN(sortDate.getTime())
    ? transaction.date || "Undated"
    : sortDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return {
    id: transaction.id || `${transaction.category}-${transaction.amount}-${transaction.timestamp || transaction.date}`,
    accountName: getAccountName(accounts, transaction.accountId),
    amount: Number(transaction.amount || 0),
    bucket: String(transaction.bucket || getBucket(transaction.category)),
    category: transaction.category || "Uncategorized",
    dateLabel,
    note: transaction.note || "",
    sortTime: Number.isNaN(sortDate.getTime()) ? 0 : sortDate.getTime(),
  };
}

function TapToEditText({ value, onCommit }) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef(null);
  const lastTapAt = useRef(0);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
    setArmed(false);
  }, [value]);

  useEffect(() => () => {
    if (armTimer.current) window.clearTimeout(armTimer.current);
  }, []);

  function beginEdit() {
    if (armTimer.current) window.clearTimeout(armTimer.current);
    lastTapAt.current = 0;
    setArmed(false);
    setEditing(true);
  }

  function handleTap() {
    const now = Date.now();
    if (armed || now - lastTapAt.current < 700) {
      beginEdit();
      return;
    }
    lastTapAt.current = now;
    setArmed(true);
    if (armTimer.current) window.clearTimeout(armTimer.current);
    armTimer.current = window.setTimeout(() => {
      lastTapAt.current = 0;
      setArmed(false);
    }, 700);
  }

  function commit() {
    const cleanDraft = draft.trim();
    if (cleanDraft && cleanDraft !== value) onCommit(cleanDraft);
    if (!cleanDraft) setDraft(value);
    setEditing(false);
    setArmed(false);
  }

  if (!editing) {
    return (
      <button
        aria-label={`Tap twice to edit ${value}`}
        className={`editable-display tap-edit-button ${armed ? "is-armed" : ""}`}
        onClick={handleTap}
        onDoubleClick={beginEdit}
        type="button"
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      className="editable-text"
      value={draft}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(value);
          setEditing(false);
          setArmed(false);
        }
      }}
    />
  );
}

function EditableText({ value, onCommit, ...props }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    const cleanDraft = draft.trim();
    if (cleanDraft && cleanDraft !== value) onCommit(cleanDraft);
    if (!cleanDraft) setDraft(value);
  }

  return (
    <input
      {...props}
      className="editable-text"
      value={draft}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function EditableNumber({ value, onCommit, ...props }) {
  const [draft, setDraft] = useState(numericInputValue(value));

  useEffect(() => {
    setDraft(numericInputValue(value));
  }, [value]);

  function commit() {
    const nextValue = Number(draft || 0);
    if (Number.isFinite(nextValue) && nextValue !== Number(value || 0)) onCommit(nextValue);
    if (!Number.isFinite(nextValue)) setDraft(String(value ?? 0));
  }

  return (
    <input
      {...props}
      value={draft}
      inputMode="decimal"
      type="number"
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => {
        if (Number(draft || 0) === 0) {
          setDraft("");
          return;
        }
        event.currentTarget.select();
      }}
      placeholder="0"
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(numericInputValue(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <article className="metric-card glass">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AllocationLine({ label, target, value }) {
  return (
    <div className="allocation-line">
      <span>{label}</span>
      <b>{value}%</b>
      <small>target {target}</small>
    </div>
  );
}

export default App;
