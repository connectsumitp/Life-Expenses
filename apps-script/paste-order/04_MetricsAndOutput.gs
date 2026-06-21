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
  var buckets = { Needs: 0, Wants: 0, Savings: 0, Transfer: 0 };

  for (var i = 0; i < transactions.length; i += 1) {
    var transaction = transactions[i];
    var countsTowardBurn = transaction.countsTowardBurn === true || String(transaction.countsTowardBurn).toLowerCase() === "true";
    if (transaction.direction === "income" || (transaction.direction === "transfer" && !countsTowardBurn)) continue;
    var rawAmount = transaction.direction === "transfer" && transaction.burnAmount !== "" && transaction.burnAmount !== undefined
      ? Number(transaction.burnAmount || 0)
      : Number(transaction.amount || 0);
    var amount = rawAmount * (transaction.direction === "transfer" && Number(transaction.burnEffect || 1) < 0 ? -1 : 1);
    var bucket = transaction.bucket || "Transfer";
    if (buckets[bucket] === undefined) buckets[bucket] = 0;
    buckets[bucket] += amount;
  }

  var total = 0;
  for (var key in buckets) {
    if (Object.prototype.hasOwnProperty.call(buckets, key)) {
      buckets[key] = Math.max(0, buckets[key]);
      total += buckets[key];
    }
  }
  var savings = buckets.Savings || 0;
  var wants = buckets.Wants || 0;
  return {
    totalBurn: total,
    savingsRate: total ? Math.max(0, Math.round((savings / total) * 100)) : 0,
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
