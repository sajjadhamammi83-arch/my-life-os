/**
 * Life OS — Local-First Domain Storage & Offline Resilience Layer
 * Coordinates immediate local updates with Native IndexedDB and manages the Outbox Queue.
 */

import { db, StoreName } from "./db";

export interface OutboxMutation {
  id: string;              // Client UUID
  endpoint: string;        // Target URL e.g. "/api/tasks"
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  payload: any;            // JSON body
  createdAt: number;       // Timestamp ms
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  tempEntityId?: string;   // For mapping client ID to server ID
  idempotencyKey: string;  // X-Idempotency-Key
  lastError?: string;
  entity?: string;
}

// ==========================================
// 1. Outbox Queue Helper Functions
// ==========================================

/**
 * Enqueues a mutation into `outbox_queue` for later background replay when online.
 */
export async function queueOfflineMutation(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  payload: any,
  tempEntityId?: string,
  entity?: string
): Promise<OutboxMutation> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const mutation: OutboxMutation = {
    id: `outbox_${timestamp}_${randomStr}`,
    endpoint,
    method,
    payload,
    createdAt: timestamp,
    status: "pending",
    retryCount: 0,
    tempEntityId,
    idempotencyKey: `idem_${timestamp}_${randomStr}`,
    entity,
  };

  await db.set("outbox_queue", mutation);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("outbox-updated", { detail: mutation }));
    window.dispatchEvent(new Event("reminders-updated"));
  }

  return mutation;
}

/**
 * Retrieves all pending outbox mutations sorted chronologically (FIFO).
 */
export async function getPendingMutations(): Promise<OutboxMutation[]> {
  const all = await db.getAll<OutboxMutation>("outbox_queue");
  return all
    .filter((m) => m.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Removes an outbox mutation by its ID.
 */
export async function removeMutation(id: string): Promise<void> {
  await db.deleteItem("outbox_queue", id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("outbox-updated"));
  }
}

/**
 * Updates an outbox mutation record.
 */
export async function updateMutation(id: string, updates: Partial<OutboxMutation>): Promise<void> {
  const existing = await db.get<OutboxMutation>("outbox_queue", id);
  if (existing) {
    const updated = { ...existing, ...updates };
    await db.set("outbox_queue", updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("outbox-updated"));
    }
  }
}

// ==========================================
// 2. Metadata Helpers
// ==========================================

export async function getMetadata<T = any>(key: string): Promise<T | undefined> {
  const record = await db.get<{ key: string; value: T }>("metadata", key);
  return record ? record.value : undefined;
}

export async function setMetadata<T = any>(key: string, value: T): Promise<void> {
  await db.set("metadata", { key, value, updatedAt: Date.now() });
}

// ==========================================
// 3. Tasks Domain Storage
// ==========================================

export async function getLocalTasks(): Promise<any[]> {
  return db.getAll("tasks");
}

export async function saveLocalTasks(tasks: any[]): Promise<void> {
  if (!tasks || !Array.isArray(tasks)) return;
  await db.putBatch("tasks", tasks);
}

export async function saveLocalTask(task: any): Promise<any> {
  return db.set("tasks", task);
}

export async function deleteLocalTask(id: string, queueSync = true): Promise<void> {
  await db.deleteItem("tasks", id);
  if (queueSync) {
    await queueOfflineMutation(`/api/tasks?id=${encodeURIComponent(id)}`, "DELETE", null, id, "tasks");
  }
}

export async function createLocalTask(taskData: any, queueSync = true): Promise<any> {
  const tempId = `loc_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowStr = new Date().toISOString();
  const newTask = {
    id: tempId,
    title: taskData.title || "",
    status: taskData.status || "today",
    isBigThree: Boolean(taskData.isBigThree),
    eisenhowerQuadrant: taskData.eisenhowerQuadrant || "Q2",
    priority: taskData.priority || "medium",
    workType: taskData.workType || "Deep Work",
    estimatedMinutes: Number(taskData.estimatedMinutes) || 30,
    createdAt: nowStr,
    updatedAt: nowStr,
    _synced: false,
    ...taskData,
  };

  await db.set("tasks", newTask);

  if (queueSync) {
    await queueOfflineMutation("/api/tasks", "POST", taskData, tempId, "tasks");
  }

  return newTask;
}

export async function toggleLocalTask(id: string, isCompleted: boolean, queueSync = true): Promise<any> {
  const existing = await db.get("tasks", id);
  const updatedStatus = isCompleted ? "completed" : "today";
  const updated = existing
    ? { ...existing, status: updatedStatus, _synced: false, updatedAt: new Date().toISOString() }
    : { id, status: updatedStatus, _synced: false, updatedAt: new Date().toISOString() };

  await db.set("tasks", updated);

  if (queueSync) {
    await queueOfflineMutation("/api/tasks", "PATCH", { id, isCompleted }, id, "tasks");
  }

  return updated;
}

export async function toggleLocalBigThree(id: string, isBigThree: boolean, queueSync = true): Promise<any> {
  const existing = await db.get("tasks", id);
  const updated = existing
    ? { ...existing, isBigThree, _synced: false, updatedAt: new Date().toISOString() }
    : { id, isBigThree, _synced: false, updatedAt: new Date().toISOString() };

  await db.set("tasks", updated);

  if (queueSync) {
    await queueOfflineMutation("/api/tasks", "PATCH", { id, isBigThree }, id, "tasks");
  }

  return updated;
}

// ==========================================
// 4. Habits Domain Storage
// ==========================================

export async function getLocalHabits(): Promise<any[]> {
  return db.getAll("habits");
}

export async function saveLocalHabits(habits: any[]): Promise<void> {
  if (!habits || !Array.isArray(habits)) return;
  await db.putBatch("habits", habits);
}

export async function toggleLocalHabit(habitId: string, completed: boolean, queueSync = true): Promise<any> {
  const existing = await db.get("habits", habitId);
  const updatedStreak = existing
    ? completed
      ? (existing.streak || 0) + 1
      : Math.max(0, (existing.streak || 1) - 1)
    : completed
    ? 1
    : 0;

  const updated = existing
    ? { ...existing, todayDone: completed, streak: updatedStreak, _synced: false }
    : { id: habitId, todayDone: completed, streak: updatedStreak, _synced: false };

  await db.set("habits", updated);

  if (queueSync) {
    await queueOfflineMutation("/api/habits", "PATCH", { habitId, completed }, habitId, "habits");
  }

  return updated;
}

// ==========================================
// 5. Today Page & Calendar Storage
// ==========================================

export async function getLocalCalendarBlocks(dateStr?: string): Promise<any[]> {
  const all = await db.getAll("calendar_blocks");
  if (!dateStr) return all;
  return all.filter((b) => !b.date || b.date.startsWith(dateStr));
}

export async function saveLocalCalendarBlocks(blocks: any[]): Promise<void> {
  if (!blocks || !Array.isArray(blocks)) return;
  await db.putBatch("calendar_blocks", blocks);
}

export async function getLocalTodayData(): Promise<{
  tasks: any[];
  habits: any[];
  calendarBlocks: any[];
}> {
  const [tasks, habits, calendarBlocks] = await Promise.all([
    getLocalTasks(),
    getLocalHabits(),
    getLocalCalendarBlocks(),
  ]);

  // Filter tasks matching Today focus view
  const todayTasks = tasks.filter(
    (t: any) => (t.status === "today" || t.isBigThree) && t.status !== "scheduled"
  );

  return { tasks: todayTasks, habits, calendarBlocks };
}

export async function saveLocalTodayData(data: {
  tasks?: any[];
  habits?: any[];
  calendarBlocks?: any[];
}): Promise<void> {
  const promises: Promise<void>[] = [];
  if (data.tasks && data.tasks.length > 0) {
    promises.push(saveLocalTasks(data.tasks));
  }
  if (data.habits && data.habits.length > 0) {
    promises.push(saveLocalHabits(data.habits));
  }
  if (data.calendarBlocks && data.calendarBlocks.length > 0) {
    promises.push(saveLocalCalendarBlocks(data.calendarBlocks));
  }
  await Promise.all(promises);
}

// ==========================================
// 6. Finance Domain Storage
// ==========================================

export async function getLocalFinanceData(): Promise<{
  summary?: any;
  costCenters: any[];
  accounts: any[];
  expenses: any[];
  fixedExpenses: any[];
  cheques: any[];
  transactions: any[];
  cashRegisters: any[];
}> {
  const [transactions, cashRegisters, cachedMeta] = await Promise.all([
    db.getAll("transactions"),
    db.getAll("cash_registers"),
    getMetadata<any>("finance_snapshot"),
  ]);

  return {
    summary: cachedMeta?.summary || {},
    costCenters: cachedMeta?.costCenters || [],
    accounts: cachedMeta?.accounts || [],
    expenses: cachedMeta?.expenses || [],
    fixedExpenses: cachedMeta?.fixedExpenses || [],
    cheques: cachedMeta?.cheques || [],
    transactions: transactions.length > 0 ? transactions : cachedMeta?.transactions || [],
    cashRegisters: cashRegisters.length > 0 ? cashRegisters : cachedMeta?.cashRegisters || [],
  };
}

export async function saveLocalFinanceData(data: any): Promise<void> {
  if (!data) return;

  const promises: Promise<any>[] = [];

  if (Array.isArray(data.transactions) && data.transactions.length > 0) {
    promises.push(db.putBatch("transactions", data.transactions));
  }
  if (Array.isArray(data.cashRegisters) && data.cashRegisters.length > 0) {
    promises.push(db.putBatch("cash_registers", data.cashRegisters));
  }

  // Snapshot other finance lists in metadata
  promises.push(
    setMetadata("finance_snapshot", {
      summary: data.summary,
      costCenters: data.costCenters,
      accounts: data.accounts,
      expenses: data.expenses,
      fixedExpenses: data.fixedExpenses,
      cheques: data.cheques,
      transactions: data.transactions,
      cashRegisters: data.cashRegisters,
    })
  );

  await Promise.all(promises);
}

export async function saveLocalCashRegister(registerData: any, queueSync = true): Promise<any> {
  const tempId = registerData.id || `loc_cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowStr = new Date().toISOString();
  const record = {
    id: tempId,
    ...registerData,
    createdAt: registerData.createdAt || nowStr,
    _synced: false,
  };

  await db.set("cash_registers", record);

  if (queueSync) {
    await queueOfflineMutation(
      "/api/finance/accounting",
      "POST",
      { type: "cash_register", ...registerData },
      tempId,
      "cash_registers"
    );
  }

  return record;
}

export async function saveLocalExpense(expenseData: any, queueSync = true): Promise<any> {
  const tempId = `loc_exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowStr = new Date().toISOString();
  const record = {
    id: tempId,
    title: expenseData.title,
    amount: expenseData.amount,
    categoryName: expenseData.categoryName,
    costCenterId: expenseData.costCenterId,
    bankAccountId: expenseData.bankAccountId,
    paymentMethod: expenseData.paymentMethod,
    description: expenseData.description,
    date: nowStr,
    type: "EXPENSE",
    _synced: false,
  };

  await db.set("transactions", record);

  if (queueSync) {
    await queueOfflineMutation(
      "/api/finance/accounting",
      "POST",
      { type: "expense", ...expenseData },
      tempId,
      "transactions"
    );
  }

  return record;
}

export async function saveLocalTransaction(txData: any, queueSync = true): Promise<any> {
  const tempId = txData.id || `loc_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id: tempId,
    ...txData,
    date: txData.date || new Date().toISOString(),
    _synced: false,
  };

  await db.set("transactions", record);

  if (queueSync) {
    await queueOfflineMutation("/api/finance/accounting", "POST", txData, tempId, "transactions");
  }

  return record;
}

// ==========================================
// 7. Daily Reviews Domain Storage
// ==========================================

export async function getLocalReviews(): Promise<any[]> {
  const reviews = await db.getAll("daily_reviews");
  return reviews.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function saveLocalReviews(reviews: any[]): Promise<void> {
  if (!reviews || !Array.isArray(reviews)) return;
  await db.putBatch("daily_reviews", reviews);
}

export async function saveLocalReview(reviewData: any, queueSync = true): Promise<any> {
  const tempId = reviewData.id || `loc_rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id: tempId,
    ...reviewData,
    _synced: false,
    updatedAt: new Date().toISOString(),
  };

  await db.set("daily_reviews", record);

  if (queueSync) {
    await queueOfflineMutation("/api/reviews", "POST", reviewData, tempId, "daily_reviews");
  }

  return record;
}

export async function deleteLocalReview(id: string, queueSync = true): Promise<void> {
  await db.deleteItem("daily_reviews", id);
  if (queueSync) {
    await queueOfflineMutation(`/api/reviews?id=${encodeURIComponent(id)}`, "DELETE", null, id, "daily_reviews");
  }
}

export const localStore = {
  queueOfflineMutation,
  getPendingMutations,
  removeMutation,
  updateMutation,
  getMetadata,
  setMetadata,
  getLocalTasks,
  saveLocalTasks,
  saveLocalTask,
  deleteLocalTask,
  createLocalTask,
  toggleLocalTask,
  toggleLocalBigThree,
  getLocalHabits,
  saveLocalHabits,
  toggleLocalHabit,
  getLocalCalendarBlocks,
  saveLocalCalendarBlocks,
  getLocalTodayData,
  saveLocalTodayData,
  getLocalFinanceData,
  saveLocalFinanceData,
  saveLocalCashRegister,
  saveLocalExpense,
  saveLocalTransaction,
  getLocalReviews,
  saveLocalReviews,
  saveLocalReview,
  deleteLocalReview,
};

export default localStore;
