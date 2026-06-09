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
