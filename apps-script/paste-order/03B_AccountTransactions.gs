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
