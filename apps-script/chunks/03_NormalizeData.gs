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

function isDateValue_(value) {
  return Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime());
}

function formatMaybeDate_(value, pattern) {
  if (isDateValue_(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), pattern);
  }
  return value === undefined || value === null ? "" : String(value);
}

function normalizeReturnedTransaction_(transaction) {
  var timestampDate = isDateValue_(transaction.timestamp) ? transaction.timestamp : null;
  var dateCell = isDateValue_(transaction.date) ? transaction.date : timestampDate;
  var monthCell = isDateValue_(transaction.monthString) ? transaction.monthString : dateCell;
  return {
    id: transaction.id || "",
    timestamp: isDateValue_(transaction.timestamp) ? isoString_(transaction.timestamp) : String(transaction.timestamp || ""),
    date: formatMaybeDate_(transaction.date, "yyyy-MM-dd"),
    dayString: transaction.dayString ? formatMaybeDate_(transaction.dayString, "EEE") : (dateCell ? formatMaybeDate_(dateCell, "EEE") : ""),
    monthString: transaction.monthString ? formatMaybeDate_(transaction.monthString, "MMM yyyy") : (monthCell ? formatMaybeDate_(monthCell, "MMM yyyy") : ""),
    monthNumber: Number(transaction.monthNumber || (dateCell ? formatMaybeDate_(dateCell, "M") : 0)),
    year: Number(transaction.year || (dateCell ? formatMaybeDate_(dateCell, "yyyy") : 0)),
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
    note: transaction.note || "",
    fromAccountId: transaction.fromAccountId || "",
    fromAccount: transaction.fromAccount || "",
    toAccountId: transaction.toAccountId || "",
    toAccount: transaction.toAccount || "",
    countsAsSavings: transaction.countsAsSavings === true || String(transaction.countsAsSavings).toLowerCase() === "true",
    countsTowardBurn: transaction.countsTowardBurn === true || String(transaction.countsTowardBurn).toLowerCase() === "true",
    burnEffect: Number(transaction.burnEffect || 0),
    burnAmount: Number(transaction.burnAmount === "" || transaction.burnAmount === undefined ? transaction.amount || 0 : transaction.burnAmount),
    savingsEffect: Number(transaction.savingsEffect || 0),
    savingsAmount: Number(transaction.savingsAmount === "" || transaction.savingsAmount === undefined ? transaction.amount || 0 : transaction.savingsAmount)
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
    note: payload.note || "",
    fromAccountId: payload.fromAccountId || "",
    fromAccount: payload.fromAccount || "",
    toAccountId: payload.toAccountId || "",
    toAccount: payload.toAccount || "",
    countsAsSavings: payload.countsAsSavings === true || String(payload.countsAsSavings).toLowerCase() === "true",
    countsTowardBurn: payload.countsTowardBurn === true || String(payload.countsTowardBurn).toLowerCase() === "true",
    burnEffect: Number(payload.burnEffect || 0),
    burnAmount: Number(payload.burnAmount === undefined ? payload.amount || 0 : payload.burnAmount),
    savingsEffect: Number(payload.savingsEffect || 0),
    savingsAmount: Number(payload.savingsAmount === undefined ? payload.amount || 0 : payload.savingsAmount)
  };
}

function getUserTransactionById_(sheet, transactionId, userId) {
  var rows = filterByUser_(readObjects_(sheet), userId);
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i].id || "") === String(transactionId || "")) return rows[i];
  }
  return null;
}

function mutateAccountsForTransaction_(ss, transaction, userId, multiplier) {
  var accountSheet = ensureSheet_(ss, SHEETS.accounts, HEADERS.accounts);
  var accounts = normalizeAccounts_(filterByUser_(readObjects_(accountSheet), userId));
  var amount = Number(transaction.amount || 0) * Number(multiplier || 1);
  var direction = transaction.direction || "expense";
  var debitId = direction === "transfer" ? transaction.fromAccountId : direction === "expense" ? transaction.accountId : "";
  var creditId = direction === "transfer" ? transaction.toAccountId : direction === "income" ? transaction.accountId : "";
  var debitFound = !debitId;
  var creditFound = !creditId;
  var reversal = Number(multiplier || 1) < 0;

  for (var i = 0; i < accounts.length; i += 1) {
    if (accounts[i].id === debitId) {
      debitFound = true;
      if (!reversal && Number(accounts[i].balance || 0) < Math.abs(amount)) {
        throw new Error("Insufficient balance in " + accounts[i].name);
      }
    }
    if (accounts[i].id === creditId) {
      creditFound = true;
      if (reversal && Number(accounts[i].balance || 0) < Math.abs(amount)) {
        throw new Error("Cannot reverse transaction: insufficient balance in " + accounts[i].name);
      }
    }
  }
  if (!debitFound || !creditFound) throw new Error("Transaction account was not found");

  var updatedAt = isoString_(new Date());
  for (var j = 0; j < accounts.length; j += 1) {
    if (accounts[j].id === debitId) {
      accounts[j].balance = Number(accounts[j].balance || 0) - amount;
      accounts[j].updatedAt = updatedAt;
    }
    if (accounts[j].id === creditId) {
      accounts[j].balance = Number(accounts[j].balance || 0) + amount;
      accounts[j].updatedAt = updatedAt;
    }
  }

  writeUserObjects_(accountSheet, HEADERS.accounts, accounts, userId);
  return accounts;
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
