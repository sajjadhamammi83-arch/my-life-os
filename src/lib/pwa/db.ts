/**
 * Life OS — Native IndexedDB Local Store Wrapper (v1.0.0)
 * Zero-dependency TypeScript persistence layer for Local-First mobile & PWA architecture.
 */

export const DB_NAME = "LifeOS_LocalDB";
export const DB_VERSION = 1;

export type StoreName =
  | "tasks"
  | "habits"
  | "habit_logs"
  | "projects"
  | "daily_reviews"
  | "cash_registers"
  | "transactions"
  | "calendar_blocks"
  | "outbox_queue"
  | "metadata";

export interface StoreConfig {
  name: StoreName;
  keyPath: string;
  indexes?: { name: string; keyPath: string | string[]; unique?: boolean }[];
}

export const STORES_CONFIG: StoreConfig[] = [
  {
    name: "tasks",
    keyPath: "id",
    indexes: [
      { name: "status", keyPath: "status" },
      { name: "isBigThree", keyPath: "isBigThree" },
      { name: "eisenhowerQuadrant", keyPath: "eisenhowerQuadrant" },
      { name: "dueDate", keyPath: "dueDate" },
      { name: "updatedAt", keyPath: "updatedAt" },
    ],
  },
  {
    name: "habits",
    keyPath: "id",
    indexes: [
      { name: "active", keyPath: "active" },
      { name: "streak", keyPath: "streak" },
    ],
  },
  {
    name: "habit_logs",
    keyPath: "id",
    indexes: [
      { name: "habitId", keyPath: "habitId" },
      { name: "date", keyPath: "date" },
    ],
  },
  {
    name: "projects",
    keyPath: "id",
    indexes: [
      { name: "status", keyPath: "status" },
    ],
  },
  {
    name: "daily_reviews",
    keyPath: "id",
    indexes: [
      { name: "date", keyPath: "date" },
    ],
  },
  {
    name: "cash_registers",
    keyPath: "id",
    indexes: [
      { name: "date", keyPath: "date" },
      { name: "costCenterId", keyPath: "costCenterId" },
    ],
  },
  {
    name: "transactions",
    keyPath: "id",
    indexes: [
      { name: "date", keyPath: "date" },
      { name: "costCenterId", keyPath: "costCenterId" },
    ],
  },
  {
    name: "calendar_blocks",
    keyPath: "id",
    indexes: [
      { name: "date", keyPath: "date" },
    ],
  },
  {
    name: "outbox_queue",
    keyPath: "id",
    indexes: [
      { name: "status", keyPath: "status" },
      { name: "createdAt", keyPath: "createdAt" },
    ],
  },
  {
    name: "metadata",
    keyPath: "key",
  },
];

let dbPromise: Promise<IDBDatabase | null> | null = null;
let dbInstance: IDBDatabase | null = null;

function getIndexedDB(): IDBFactory | null {
  if (typeof window !== "undefined" && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).indexedDB) {
    return (globalThis as any).indexedDB;
  }
  return null;
}

/**
 * Initializes and returns the singleton LifeOS_LocalDB database connection.
 * Safe to call in SSR (resolves to null).
 */
export async function initDB(): Promise<IDBDatabase | null> {
  const idbFactory = getIndexedDB();
  if (!idbFactory) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
    try {
      const request = idbFactory.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        for (const storeConfig of STORES_CONFIG) {
          let store: IDBObjectStore;
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
            });
          } else {
            store = request.transaction!.objectStore(storeConfig.name);
          }

          if (storeConfig.indexes) {
            for (const idx of storeConfig.indexes) {
              if (!store.indexNames.contains(idx.name)) {
                store.createIndex(idx.name, idx.keyPath, {
                  unique: idx.unique || false,
                });
              }
            }
          }
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;

        dbInstance.onclose = () => {
          dbInstance = null;
          dbPromise = null;
        };

        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbPromise = null;
        };

        resolve(dbInstance);
      };

      request.onerror = () => {
        console.error("[IndexedDB] Error opening database:", request.error);
        dbPromise = null;
        resolve(null);
      };

      request.onblocked = () => {
        console.warn("[IndexedDB] Database open blocked by another tab");
      };
    } catch (err) {
      console.error("[IndexedDB] Exception opening database:", err);
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Retrieves a single record by its key from the specified store.
 */
export async function get<T = any>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await initDB();
  if (!db) return undefined;

  return new Promise<T | undefined>((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error(`[IndexedDB] Error in get(${storeName}, ${String(key)}):`, request.error);
        resolve(undefined);
      };
    } catch (err) {
      console.error(`[IndexedDB] Transaction error in get(${storeName}):`, err);
      resolve(undefined);
    }
  });
}

/**
 * Stores or updates a record in the specified store.
 */
export async function set<T = any>(storeName: StoreName, value: T): Promise<T> {
  const db = await initDB();
  if (!db) return value;

  return new Promise<T>((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve(value);
      request.onerror = () => {
        console.error(`[IndexedDB] Error in set(${storeName}):`, request.error);
        resolve(value);
      };
    } catch (err) {
      console.error(`[IndexedDB] Transaction error in set(${storeName}):`, err);
      resolve(value);
    }
  });
}

/**
 * Retrieves all records from the specified store, optionally matching a query or limited by count.
 */
export async function getAll<T = any>(
  storeName: StoreName,
  query?: IDBValidKey | IDBKeyRange | null,
  count?: number
): Promise<T[]> {
  const db = await initDB();
  if (!db) return [];

  return new Promise<T[]>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = query !== undefined && query !== null ? store.getAll(query, count) : store.getAll(undefined, count);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error(`[IndexedDB] Error in getAll(${storeName}):`, request.error);
        resolve([]);
      };
    } catch (err) {
      console.error(`[IndexedDB] Transaction error in getAll(${storeName}):`, err);
      resolve([]);
    }
  });
}

/**
 * Deletes a single record by its key from the specified store.
 */
export async function deleteItem(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await initDB();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`[IndexedDB] Error in deleteItem(${storeName}, ${String(key)}):`, request.error);
        resolve();
      };
    } catch (err) {
      console.error(`[IndexedDB] Transaction error in deleteItem(${storeName}):`, err);
      resolve();
    }
  });
}

/**
 * Clears all records from the specified store.
 */
export async function clear(storeName: StoreName): Promise<void> {
  const db = await initDB();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`[IndexedDB] Error in clear(${storeName}):`, request.error);
        resolve();
      };
    } catch (err) {
      console.error(`[IndexedDB] Transaction error in clear(${storeName}):`, err);
      resolve();
    }
  });
}

/**
 * Batch puts multiple records into the specified store within a single transaction.
 */
export async function putBatch<T = any>(storeName: StoreName, items: T[]): Promise<void> {
  if (!items || items.length === 0) return;
  const db = await initDB();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      for (const item of items) {
        store.put(item);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error(`[IndexedDB] Error in putBatch(${storeName}):`, tx.error);
        resolve();
      };
      tx.onabort = () => {
        console.warn(`[IndexedDB] Transaction aborted in putBatch(${storeName}):`, tx.error);
        resolve();
      };
    } catch (err) {
      console.error(`[IndexedDB] Transaction error in putBatch(${storeName}):`, err);
      resolve();
    }
  });
}

/**
 * Counts the number of items in a store.
 */
export async function count(storeName: StoreName): Promise<number> {
  const db = await initDB();
  if (!db) return 0;

  return new Promise<number>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

export const db = {
  initDB,
  get,
  set,
  getAll,
  deleteItem,
  clear,
  putBatch,
  count,
};

export default db;
