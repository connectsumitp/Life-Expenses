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

function getWorkbook_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return {};
  }
}

function getRequestUserId_(e) {
  var params = (e && e.parameter) || {};
  return normalizeUserId_(params.userId || params.user || "");
}

function normalizeUserId_(value) {
  var clean = String(value || "").trim();
  return clean || "default-user";
}

function isoString_(date) {
  var safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  if (safeDate.toISOString) {
    return safeDate.toISOString();
  }
  return Utilities.formatDate(safeDate, "Etc/UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function testFinanceCommandCenterSetup() {
  var ss = getWorkbook_();
  ensureSheet_(ss, SHEETS.transactions, HEADERS.transactions);
  ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts);
  ensureSheet_(ss, SHEETS.assets, HEADERS.assets);
  ensureSheet_(ss, SHEETS.categories, HEADERS.categories);
  ensureSheet_(ss, SHEETS.budgets, HEADERS.budgets);
  ensureSheet_(ss, SHEETS.recurring, HEADERS.recurring);
  Logger.log("Finance Command Center Apps Script setup OK");
  return true;
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }

  var width = Math.max(sheet.getLastColumn(), headers.length);
  var currentHeaders = sheet.getRange(1, 1, 1, width).getValues()[0];
  var missingHeaders = false;

  for (var i = 0; i < headers.length; i += 1) {
    if (currentHeaders[i] !== headers[i]) {
      missingHeaders = true;
      break;
    }
  }

  if (missingHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function readObjects_(sheet) {
  if (!sheet) {
    return [];
  }

  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  var values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  var headers = values[0];
  var rows = [];

  for (var r = 1; r < values.length; r += 1) {
    var currentRow = values[r] || [];
    var hasValue = false;
    for (var c = 0; c < currentRow.length; c += 1) {
      if (currentRow[c] !== "" && currentRow[c] !== null) {
        hasValue = true;
        break;
      }
    }
    if (!hasValue) {
      continue;
    }

    var row = {};
    for (var h = 0; h < headers.length; h += 1) {
      if (!headers[h]) {
        continue;
      }
      row[headers[h]] = currentRow[h];
    }
    rows.push(row);
  }

  return rows;
}

function writeObjects_(sheet, headers, rows) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!rows || !rows.length) return;

  var values = [];
  for (var r = 0; r < rows.length; r += 1) {
    var row = [];
    for (var h = 0; h < headers.length; h += 1) {
      var value = rows[r][headers[h]];
      row.push(value === undefined || value === null ? "" : value);
    }
    values.push(row);
  }

  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function filterByUser_(rows, userId) {
  var target = normalizeUserId_(userId);
  var output = [];
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i] || {};
    if (normalizeUserId_(row.userId) === target) output.push(row);
  }
  return output;
}

function withUserId_(rows, userId) {
  var target = normalizeUserId_(userId);
  var output = [];
  for (var i = 0; i < rows.length; i += 1) {
    var row = {};
    var source = rows[i] || {};
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) row[key] = source[key];
    }
    row.userId = target;
    output.push(row);
  }
  return output;
}

function writeUserObjects_(sheet, headers, rows, userId) {
  var target = normalizeUserId_(userId);
  var existing = readObjects_(sheet);
  var retained = [];
  for (var i = 0; i < existing.length; i += 1) {
    if (normalizeUserId_(existing[i].userId) !== target) retained.push(existing[i]);
  }
  writeObjects_(sheet, headers, retained.concat(withUserId_(rows || [], target)));
}

function upsertUserTransaction_(sheet, transaction, userId) {
  var target = normalizeUserId_(userId);
  var transactionId = String(transaction.id || "").trim();
  if (!transactionId) {
    appendObject_(sheet, HEADERS.transactions, transaction);
    return false;
  }

  var rows = readObjects_(sheet);
  var updated = false;
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i].id || "") === transactionId && normalizeUserId_(rows[i].userId) === target) {
      rows[i] = transaction;
      updated = true;
      break;
    }
  }

  if (!updated) rows.push(transaction);
  writeObjects_(sheet, HEADERS.transactions, rows);
  return updated;
}

function deleteUserTransaction_(sheet, transactionId, userId) {
  if (!transactionId) return false;
  var target = normalizeUserId_(userId);
  var rows = readObjects_(sheet);
  var kept = [];
  var deleted = false;

  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i] || {};
    if (!deleted && String(row.id || "") === transactionId && normalizeUserId_(row.userId) === target) {
      deleted = true;
      continue;
    }
    kept.push(row);
  }

  if (deleted) writeObjects_(sheet, HEADERS.transactions, kept);
  return deleted;
}

function appendObject_(sheet, headers, row) {
  var values = [];
  for (var i = 0; i < headers.length; i += 1) {
    var value = row[headers[i]];
    values.push(value === undefined || value === null ? "" : value);
  }
  sheet.appendRow(values);
}

function normalizeCategories_(categories, bucketMap) {
  if (!Array.isArray(categories)) return [];
  var output = [];

  for (var i = 0; i < categories.length; i += 1) {
    var raw = categories[i];
    var name = typeof raw === "string" ? raw : raw.name;
    if (!name) continue;
    var bucket = typeof raw === "string" ? bucketMap[name] : raw.bucket || bucketMap[name];
    output.push({
      name: name === "Food Outside" ? "Life Enjoyment" : name,
      bucket: bucket || inferBucket_(name)
    });
  }

  return output;
}

function normalizeAccounts_(accounts) {
  if (!Array.isArray(accounts)) return [];
  var output = [];

  for (var i = 0; i < accounts.length; i += 1) {
    var account = accounts[i] || {};
    var name = account.name || "Account " + (i + 1);
    output.push({
      id: account.id || slug_(name),
      name: name,
      type: account.type || "Other",
      balance: Number(account.balance || account.value || 0),
      updatedAt: account.updatedAt || isoString_(new Date())
    });
  }

  return output;
}

function readUserAssets_(sheet, userId, mainSheet) {
  var rows = filterByUser_(readObjects_(sheet), userId);
  if (rows.length) {
    return {
      mutualFunds: Number(rows[0].mutualFunds || 0),
      stocks: Number(rows[0].stocks || 0)
    };
  }
  return {
    mutualFunds: Number(mainSheet.getRange("C16").getValue() || 0),
    stocks: Number(mainSheet.getRange("C17").getValue() || 0)
  };
}

function normalizeBudgets_(budgets) {
  var output = {
    monthlyTotal: Number((budgets && budgets.monthlyTotal) || 0),
    categories: {}
  };
  var categories = (budgets && budgets.categories) || {};
  for (var name in categories) {
    if (Object.prototype.hasOwnProperty.call(categories, name)) {
      output.categories[name] = Number(categories[name] || 0);
    }
  }
  return output;
}

function readBudgets_(rows) {
  var output = {
    monthlyTotal: 0,
    categories: {}
  };
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i] || {};
    if (row.scope === "monthly") {
      output.monthlyTotal = Number(row.limit || 0);
    }
    if (row.scope === "category" && row.name) {
      output.categories[row.name] = Number(row.limit || 0);
    }
  }
  return output.monthlyTotal || Object.keys(output.categories).length ? output : null;
}

function budgetRows_(budgets) {
  var rows = [{ scope: "monthly", name: "total", limit: Number(budgets.monthlyTotal || 0) }];
  var categories = budgets.categories || {};
  for (var name in categories) {
    if (Object.prototype.hasOwnProperty.call(categories, name)) {
      rows.push({ scope: "category", name: name, limit: Number(categories[name] || 0) });
    }
  }
  return rows;
}

function normalizeRecurring_(rules) {
  if (!Array.isArray(rules)) return [];
  var output = [];
  for (var i = 0; i < rules.length; i += 1) {
    var rule = rules[i] || {};
    output.push({
      id: rule.id || "recurring-" + i,
      name: rule.name || "Recurring item",
      category: rule.category || "",
      amount: Number(rule.amount || 0),
      frequency: rule.frequency === "weekly" ? "weekly" : "monthly",
      dueDay: Number(rule.dueDay || 1)
    });
  }
  return output;
}

function normalizeReturnedTransaction_(transaction) {
  return {
    id: transaction.id || "",
    timestamp: transaction.timestamp || "",
    date: transaction.date || "",
    dayString: transaction.dayString || "",
    monthString: transaction.monthString || "",
    monthNumber: Number(transaction.monthNumber || 0),
    year: Number(transaction.year || 0),
    weekNumber: Number(transaction.weekNumber || 0),
    weekOfMonth: Number(transaction.weekOfMonth || 0),
    direction: transaction.direction || "expense",
    category: transaction.category || "",
    bucket: transaction.bucket || "",
    amount: Number(transaction.amount || 0),
    accountId: transaction.accountId || "",
    account: transaction.account || "",
    source: transaction.source || "",
    type: transaction.type || "",
    note: transaction.note || ""
  };
}

function normalizeTransaction_(payload, direction) {
  var now = new Date(payload.timestamp || new Date());
  var timeZone = Session.getScriptTimeZone();
  return {
    id: payload.id || String(now.getTime()),
    timestamp: isoString_(now),
    date: payload.date || Utilities.formatDate(now, timeZone, "yyyy-MM-dd"),
    dayString: payload.dayString || Utilities.formatDate(now, timeZone, "EEE"),
    monthString: payload.monthString || Utilities.formatDate(now, timeZone, "MMM yyyy"),
    monthNumber: Number(payload.monthNumber || now.getMonth() + 1),
    year: Number(payload.year || now.getFullYear()),
    weekNumber: Number(payload.weekNumber || 0),
    weekOfMonth: Number(payload.weekOfMonth || Math.min(4, Math.ceil(now.getDate() / 7))),
    direction: direction,
    category: payload.category || payload.source || "",
    bucket: payload.bucket || payload.type || (direction === "income" ? "Income" : inferBucket_(payload.category)),
    amount: Number(payload.amount || 0),
    accountId: payload.accountId || "",
    account: payload.account || "",
    source: payload.source || payload.category || "",
    type: payload.type || payload.bucket || "",
    note: payload.note || ""
  };
}

function upsertAccount_(ss, account, userId) {
  var sheet = ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts);
  var accounts = normalizeAccounts_(filterByUser_(readObjects_(sheet), userId));
  var normalized = normalizeAccounts_([account])[0];
  var found = false;

  for (var i = 0; i < accounts.length; i += 1) {
    if (accounts[i].id === normalized.id) {
      accounts[i] = normalized;
      found = true;
      break;
    }
  }

  if (!found) accounts.unshift(normalized);
  writeUserObjects_(sheet, HEADERS.accounts, accounts, userId);
}

function toBucketMap_(categories) {
  var map = {};
  for (var i = 0; i < categories.length; i += 1) {
    map[categories[i].name] = categories[i].bucket;
  }
  return map;
}

function inferBucket_(name) {
  var needs = ["Daily Essentials", "Commuting", "Home & Utilities", "Health & Fitness"];
  var wants = ["Life Enjoyment", "Food Outside", "Personal Care", "Subscriptions"];
  if (needs.indexOf(name) >= 0) return "Needs";
  if (wants.indexOf(name) >= 0) return "Wants";
  return "Savings";
}

function buildMetrics_(transactions) {
  var totalBurn = 0;
  var savings = 0;
  var wants = 0;

  for (var i = 0; i < transactions.length; i += 1) {
    var transaction = transactions[i];
    if (transaction.direction === "income") continue;
    var amount = Number(transaction.amount || 0);
    if (transaction.bucket === "Savings") {
      savings += amount;
    } else {
      totalBurn += amount;
    }
    if (transaction.bucket === "Wants") wants += amount;
  }

  var total = totalBurn + savings;
  return {
    totalBurn: totalBurn,
    savingsRate: total ? Math.round((savings / total) * 100) : 0,
    unplanned: Math.max(0, wants - total * 0.3)
  };
}

function slug_(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "account";
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function errorJson_(error) {
  return json_({
    ok: false,
    error: String(error && error.message ? error.message : error),
    stack: String(error && error.stack ? error.stack : "")
  });
}
