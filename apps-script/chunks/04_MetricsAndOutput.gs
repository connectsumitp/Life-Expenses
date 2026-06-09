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
