var SPREADSHEET_ID = "1cxV5e54BYIHx9rl3jq8aLfTN0K5lWI4q6clhRIY-Ogk";

var SHEETS = {
  accounts: "Accounts",
  assets: "Assets",
  budgets: "Budgets",
  categories: "Categories",
  recurring: "Recurring",
  transactions: "Transactions"
};

var HEADERS = {
  accounts: ["id", "name", "type", "balance", "updatedAt", "userId"],
  assets: ["mutualFunds", "stocks", "updatedAt", "userId"],
  budgets: ["scope", "name", "limit", "userId"],
  categories: ["name", "bucket", "userId"],
  recurring: ["id", "name", "category", "amount", "frequency", "dueDay", "userId"],
  transactions: [
    "id",
    "timestamp",
    "date",
    "dayString",
    "monthString",
    "monthNumber",
    "year",
    "weekNumber",
    "weekOfMonth",
    "direction",
    "category",
    "bucket",
    "amount",
    "accountId",
    "account",
    "source",
    "type",
    "note",
    "userId"
  ]
};

function doGet(e) {
  try {
    return handleGet_(e);
  } catch (error) {
    return errorJson_(error);
  }
}

function doPost(e) {
  try {
    return handlePost_(e);
  } catch (error) {
    return errorJson_(error);
  }
}

function handleGet_(e) {
  var ss = getWorkbook_();
  var userId = getRequestUserId_(e);
  var mainSheet = ss.getSheets()[0];
  var transactionsSheet = ensureSheet_(ss, SHEETS.transactions, HEADERS.transactions);
  var accountsSheet = ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts);
  var assetsSheet = ensureSheet_(ss, SHEETS.assets, HEADERS.assets);
  var categoriesSheet = ensureSheet_(ss, SHEETS.categories, HEADERS.categories);
  var budgetsSheet = ensureSheet_(ss, SHEETS.budgets, HEADERS.budgets);
  var recurringSheet = ensureSheet_(ss, SHEETS.recurring, HEADERS.recurring);
  var transactions = filterByUser_(readObjects_(transactionsSheet), userId);
  var accounts = normalizeAccounts_(filterByUser_(readObjects_(accountsSheet), userId));
  var assets = readUserAssets_(assetsSheet, userId, mainSheet);
  var categories = normalizeCategories_(filterByUser_(readObjects_(categoriesSheet), userId), {});
  var categoryBuckets = toBucketMap_(categories);
  var returnedTransactions = [];

  for (var i = transactions.length - 1; i >= 0; i -= 1) {
    returnedTransactions.push(normalizeReturnedTransaction_(transactions[i]));
  }

  return json_({
    ok: true,
    transactions: returnedTransactions,
    accounts: accounts,
    categories: categories,
    categoryBuckets: categoryBuckets,
    budgets: readBudgets_(filterByUser_(readObjects_(budgetsSheet), userId)),
    recurringRules: normalizeRecurring_(filterByUser_(readObjects_(recurringSheet), userId)),
    assets: assets,
    cells: {
      C16: assets.mutualFunds,
      C17: assets.stocks
    },
    totalBurn: buildMetrics_(transactions).totalBurn,
    savingsRate: buildMetrics_(transactions).savingsRate,
    unplanned: buildMetrics_(transactions).unplanned
  });
}

function handlePost_(e) {
  var payload = parsePayload_(e);
  var action = payload.action;
  var ss = getWorkbook_();
  var userId = normalizeUserId_(payload.userId);

  if (action === "saveCategories") {
    var categories = normalizeCategories_(payload.categories, payload.categoryBuckets || {});
    writeUserObjects_(ensureSheet_(ss, SHEETS.categories, HEADERS.categories), HEADERS.categories, categories, userId);
    return json_({ ok: true, action: action, categories: categories, categoryBuckets: toBucketMap_(categories) });
  }

  if (action === "saveAccounts") {
    var accounts = normalizeAccounts_(payload.accounts);
    writeUserObjects_(ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts), HEADERS.accounts, accounts, userId);
    return json_({ ok: true, action: action, accounts: accounts });
  }

  if (action === "saveBudgets") {
    var budgets = normalizeBudgets_(payload.budgets || payload);
    writeUserObjects_(ensureSheet_(ss, SHEETS.budgets, HEADERS.budgets), HEADERS.budgets, budgetRows_(budgets), userId);
    return json_({ ok: true, action: action, budgets: budgets });
  }

  if (action === "saveRecurring") {
    var recurringRules = normalizeRecurring_(payload.recurringRules || payload.rules);
    writeUserObjects_(ensureSheet_(ss, SHEETS.recurring, HEADERS.recurring), HEADERS.recurring, recurringRules, userId);
    return json_({ ok: true, action: action, recurringRules: recurringRules });
  }

  if (action === "addExpense" || action === "addIncome") {
    var direction = action === "addIncome" ? "income" : "expense";
    var row = normalizeTransaction_(payload, direction);
    row.userId = userId;
    upsertUserTransaction_(ensureSheet_(ss, SHEETS.transactions, HEADERS.transactions), row, userId);
    if (Array.isArray(payload.accounts)) {
      var nextAccounts = normalizeAccounts_(payload.accounts);
      writeUserObjects_(ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts), HEADERS.accounts, nextAccounts, userId);
    }
    return json_({ ok: true, action: action, transaction: row });
  }

  if (action === "deleteTransaction") {
    var deletedId = String(payload.transactionId || payload.id || "").trim();
    var deleted = deleteUserTransaction_(ensureSheet_(ss, SHEETS.transactions, HEADERS.transactions), deletedId, userId);
    if (Array.isArray(payload.accounts)) {
      var replacementAccounts = normalizeAccounts_(payload.accounts);
      writeUserObjects_(ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts), HEADERS.accounts, replacementAccounts, userId);
    }
    return json_({ ok: true, action: action, deleted: deleted, transactionId: deletedId });
  }

  if (action === "updateGroww") {
    var cells = payload.cells || {};
    var mf = Number(payload.mf || payload.mutualFunds || cells.C16 || 0);
    var stocks = Number(payload.stocks || payload.stocksVal || cells.C17 || 0);
    writeUserObjects_(ensureSheet_(ss, SHEETS.assets, HEADERS.assets), HEADERS.assets, [{
      mutualFunds: mf,
      stocks: stocks,
      updatedAt: isoString_(new Date())
    }], userId);
    return json_({ ok: true, action: action, assets: { mutualFunds: mf, stocks: stocks } });
  }

  if (action === "updateAssetSource") {
    if (payload.account) {
      upsertAccount_(ss, payload.account, userId);
    }
    return json_({ ok: true, action: action, account: payload.account || null });
  }

  return json_({ ok: false, error: "Unknown action: " + (action || "missing") });
}
