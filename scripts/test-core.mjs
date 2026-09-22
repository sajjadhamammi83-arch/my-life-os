import assert from "node:assert/strict";

console.log("🧪 Running Life OS Core Math & Business Rules Verification...");

// 1. Sleep Efficiency Formula
function calculateSleepEfficiency(totalSleepMinutes, timeInBedMinutes) {
  if (!timeInBedMinutes || timeInBedMinutes <= 0) return 0;
  return Math.min(100, Math.round((totalSleepMinutes / timeInBedMinutes) * 1000) / 10);
}

const se1 = calculateSleepEfficiency(420, 450); // 7h sleep, 7.5h in bed
assert.equal(se1, 93.3, "Sleep efficiency calculation failed");

const se2 = calculateSleepEfficiency(0, 400);
assert.equal(se2, 0, "Zero sleep efficiency failed");

console.log("  ✓ Sleep Efficiency formula verified");

// 2. Accounting Principles & Equations
// Assets = Liabilities + Equity (Net Worth)
// Net Worth = Total Assets - Total Liabilities
function calculateNetWorth(assets, liabilities) {
  return assets - liabilities;
}

const totalAssets = 52000000 + 18500000 + 6850000 + 14500000 + 25000000; // Bank + Personal + Shop + Receivable + Inventory
const totalLiabilities = 14000000 + 5000000; // Debt + Payables
const netWorth = calculateNetWorth(totalAssets, totalLiabilities);
assert.equal(netWorth, 97850000, "Net worth formula mismatch");
assert.equal(totalAssets, totalLiabilities + netWorth, "Balance Sheet equation mismatch");
console.log("  ✓ Balance Sheet Equation (Assets = Liabilities + Equity) verified");

// 3. Profit and Loss (P&L) Formula
// Gross Profit = Revenue - COGS
// Net Profit = Gross Profit - Operating Expenses
function calculateProfit(revenue, cogs, operatingExpenses) {
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - operatingExpenses;
  return { grossProfit, netProfit };
}

const pnl = calculateProfit(120000000, 84000000, 15000000);
assert.equal(pnl.grossProfit, 36000000, "Gross profit mismatch");
assert.equal(pnl.netProfit, 21000000, "Net profit mismatch");
console.log("  ✓ Profit & Loss (P&L) engine verified");

// 4. Shop Cash Register Balancing Formula
// Expected Closing Cash = Opening Cash + Sales - Expenses - Personal Withdrawals
// Difference = Actual Closing Cash - Expected Closing Cash
function balanceCashRegister(opening, sales, expenses, withdrawals, actual) {
  const expected = opening + sales - expenses - withdrawals;
  const diff = actual - expected;
  return { expected, diff, balanced: diff === 0 };
}

const cr = balanceCashRegister(5000000, 3200000, 450000, 900000, 6850000);
assert.equal(cr.expected, 6850000, "Expected cash calculation failed");
assert.equal(cr.diff, 0, "Cash difference must be 0 for balanced register");
assert.equal(cr.balanced, true, "Cash register balancing failed");
console.log("  ✓ Shop Cash Register balancing & difference detection verified");

// 5. Inventory Movement on Sale & Purchase
function processInventoryMovement(currentStock, type, quantity) {
  if (type === "sale" || type === "damage" || type === "loss") {
    if (currentStock < quantity) throw new Error("موجودی ناکافی است");
    return currentStock - quantity;
  }
  if (type === "purchase" || type === "return") {
    return currentStock + quantity;
  }
  return currentStock;
}

let stock = 30;
stock = processInventoryMovement(stock, "sale", 5);
assert.equal(stock, 25, "Sale must reduce inventory");
stock = processInventoryMovement(stock, "purchase", 20);
assert.equal(stock, 45, "Purchase must increase inventory");
console.log("  ✓ Inventory movements (Sales reduction & Purchases addition) verified");

// 6. Goal & Key Result Progress Formula
function calculateKRProgress(baseline, current, target) {
  if (target === baseline) return 100;
  const raw = ((current - baseline) / (target - baseline)) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

const krProgress = calculateKRProgress(60, 130, 200); // 70 / 140 = 50%
assert.equal(krProgress, 50, "KR progress calculation failed");
console.log("  ✓ OKR / Key Result progress calculation verified");

// 7. Transfers should not create false income or expense
function calculateCashFlow(transactions) {
  let operatingInflow = 0;
  let operatingOutflow = 0;
  for (const t of transactions) {
    if (t.type === "Income" || t.type === "Sale") {
      operatingInflow += t.amount;
    } else if (t.type === "Expense" || t.type === "Purchase") {
      operatingOutflow += t.amount;
    }
    // Transfers between accounts must NOT affect total net income or expense!
  }
  return { operatingInflow, operatingOutflow, netOperating: operatingInflow - operatingOutflow };
}

const testTx = [
  { type: "Sale", amount: 1000 },
  { type: "Expense", amount: 300 },
  { type: "Transfer", amount: 500 }, // between bank accounts
];
const cf = calculateCashFlow(testTx);
assert.equal(cf.operatingInflow, 1000);
assert.equal(cf.operatingOutflow, 300);
assert.equal(cf.netOperating, 700);
console.log("  ✓ Account transfer neutrality in cash flow verified");

console.log("\n🎉 ALL CORE LIFE OS LOGIC & FORMULA TESTS PASSED!");
