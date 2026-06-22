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
  var burnBuckets = { Needs: 0, Wants: 0, Savings: 0, Transfer: 0 };
  var allocationBuckets = { Needs: 0, Wants: 0, Savings: 0 };
  var income = 0;

  for (var i = 0; i < transactions.length; i += 1) {
    var transaction = transactions[i];
    if (transaction.direction === "income") {
      income += Number(transaction.amount || 0);
      continue;
    }
    var countsTowardBurn = transaction.countsTowardBurn === true || String(transaction.countsTowardBurn).toLowerCase() === "true";
    var countsAsSavings = transaction.countsAsSavings === true || String(transaction.countsAsSavings).toLowerCase() === "true";
    if (transaction.direction === "expense" || countsTowardBurn) {
      var rawBurn = transaction.direction === "transfer" && transaction.burnAmount !== "" && transaction.burnAmount !== undefined
        ? Number(transaction.burnAmount || 0)
        : Number(transaction.amount || 0);
      var burn = rawBurn * (transaction.direction === "transfer" && Number(transaction.burnEffect || 1) < 0 ? -1 : 1);
      var burnBucket = transaction.bucket || "Transfer";
      if (burnBuckets[burnBucket] === undefined) burnBuckets[burnBucket] = 0;
      burnBuckets[burnBucket] += burn;
    }
    if (transaction.direction === "expense") {
      var expenseBucket = transaction.bucket || inferBucket_(transaction.category);
      if (allocationBuckets[expenseBucket] === undefined) allocationBuckets[expenseBucket] = 0;
      allocationBuckets[expenseBucket] += Number(transaction.amount || 0);
    } else if (transaction.direction === "transfer" && countsAsSavings) {
      var rawSavings = transaction.savingsAmount !== "" && transaction.savingsAmount !== undefined
        ? Number(transaction.savingsAmount || 0)
        : Number(transaction.amount || 0);
      allocationBuckets.Savings += rawSavings * (Number(transaction.savingsEffect || 1) < 0 ? -1 : 1);
    }
  }

  var total = 0;
  for (var key in burnBuckets) {
    if (Object.prototype.hasOwnProperty.call(burnBuckets, key)) {
      burnBuckets[key] = Math.max(0, burnBuckets[key]);
      total += burnBuckets[key];
    }
  }
  var allocationTotal = 0;
  for (var allocationKey in allocationBuckets) {
    if (Object.prototype.hasOwnProperty.call(allocationBuckets, allocationKey)) {
      allocationBuckets[allocationKey] = Math.max(0, allocationBuckets[allocationKey]);
      allocationTotal += allocationBuckets[allocationKey];
    }
  }
  var allocationBase = income || allocationTotal;
  var savings = allocationBuckets.Savings || 0;
  var wants = allocationBuckets.Wants || 0;
  return {
    totalBurn: total,
    savingsRate: allocationBase ? Math.max(0, Math.round((savings / allocationBase) * 100)) : 0,
    unplanned: Math.max(0, wants - allocationBase * 0.3)
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
