/**
 * Life OS — Offline-to-Online Synchronization Engine (v1.0.0)
 * Replays queued outbox mutations when connectivity is restored,
 * reconciles temporary client IDs, and broadcasts live sync state.
 */

import {
  getPendingMutations,
  removeMutation,
  updateMutation,
  OutboxMutation,
} from "./local-store";

export type SyncState = "online" | "offline" | "syncing" | "error";

export interface SyncStatus {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: number | null;
  lastError?: string;
}

class SyncEngine {
  private state: SyncState = "online";
  private lastSyncedAt: number | null = null;
  private lastError?: string;
  private isProcessing = false;
  private intervalId: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.state = navigator.onLine ? "online" : "offline";
      this.initListeners();
    }
  }

  private initListeners() {
    window.addEventListener("online", () => {
      this.state = "online";
      this.notifyStatus();
      this.syncNow();
    });

    window.addEventListener("offline", () => {
      this.state = "offline";
      this.notifyStatus();
    });

    window.addEventListener("outbox-updated", () => {
      this.notifyStatus();
      if (this.state !== "offline" && !this.isProcessing) {
        this.syncNow();
      }
    });

    // Periodic sync poll every 25 seconds when online
    this.intervalId = setInterval(() => {
      if (this.state !== "offline" && !this.isProcessing) {
        this.checkServerAndSync();
      }
    }, 25000);

    // Initial check after boot
    setTimeout(() => {
      this.checkServerAndSync();
    }, 2000);
  }

  public getStatus(): SyncStatus {
    return {
      state: this.state,
      pendingCount: 0, // Computed dynamically in async calls
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  public async getStatusWithCount(): Promise<SyncStatus> {
    try {
      const pending = await getPendingMutations();
      return {
        state: this.state,
        pendingCount: pending.length,
        lastSyncedAt: this.lastSyncedAt,
        lastError: this.lastError,
      };
    } catch {
      return this.getStatus();
    }
  }

  private async notifyStatus() {
    if (typeof window === "undefined") return;
    const status = await this.getStatusWithCount();
    window.dispatchEvent(
      new CustomEvent("sync-status-changed", { detail: status })
    );
  }

  /**
   * Performs a lightweight ping to verify actual server reachability.
   */
  public async checkServerReachable(): Promise<boolean> {
    if (typeof window === "undefined" || !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/reminders/tomorrow", {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  }

  public async checkServerAndSync(): Promise<void> {
    const reachable = await this.checkServerReachable();
    if (!reachable) {
      if (this.state !== "offline") {
        this.state = "offline";
        this.notifyStatus();
      }
      return;
    }

    if (this.state === "offline") {
      this.state = "online";
      this.notifyStatus();
    }

    await this.syncNow();
  }

  /**
   * Replays pending mutations from the Outbox FIFO queue.
   */
  public async syncNow(): Promise<void> {
    if (this.isProcessing || typeof window === "undefined") return;

    let pending: OutboxMutation[] = [];
    try {
      pending = await getPendingMutations();
    } catch (err) {
      console.error("[SyncEngine] Failed to read pending mutations:", err);
      return;
    }

    if (pending.length === 0) {
      if (this.state === "syncing") {
        this.state = "online";
      }
      this.notifyStatus();
      return;
    }

    this.isProcessing = true;
    this.state = "syncing";
    this.notifyStatus();

    let hadNetworkFailure = false;

    for (const mutation of pending) {
      try {
        await updateMutation(mutation.id, { status: "syncing" });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Idempotency-Key": mutation.idempotencyKey,
        };

        const fetchOptions: RequestInit = {
          method: mutation.method,
          headers,
        };

        if (mutation.payload && mutation.method !== "DELETE") {
          fetchOptions.body = JSON.stringify(mutation.payload);
        }

        const res = await fetch(mutation.endpoint, fetchOptions);

        if (res.ok) {
          // Success! Remove from outbox
          await removeMutation(mutation.id);
        } else if (res.status >= 400 && res.status < 500) {
          // Client error (e.g. invalid payload or not found) -> retry up to 3 times
          const nextRetry = (mutation.retryCount || 0) + 1;
          if (nextRetry >= 3) {
            console.warn(`[SyncEngine] Dropping unrecoverable mutation ${mutation.id} after ${nextRetry} tries.`);
            await removeMutation(mutation.id);
          } else {
            await updateMutation(mutation.id, {
              status: "pending",
              retryCount: nextRetry,
              lastError: `HTTP ${res.status}`,
            });
          }
        } else {
          // Server error 5xx -> keep in pending and pause sync
          hadNetworkFailure = true;
          await updateMutation(mutation.id, {
            status: "pending",
            retryCount: (mutation.retryCount || 0) + 1,
            lastError: `Server error HTTP ${res.status}`,
          });
          break;
        }
      } catch (err: any) {
        // Network connection error -> pause sync and preserve outbox
        hadNetworkFailure = true;
        this.lastError = err?.message || "Network request failed";
        await updateMutation(mutation.id, {
          status: "pending",
          lastError: this.lastError,
        });
        break;
      }
    }

    this.isProcessing = false;

    if (hadNetworkFailure) {
      this.state = "offline";
    } else {
      this.state = "online";
      this.lastSyncedAt = Date.now();
      this.lastError = undefined;
      // Trigger UI updates
      window.dispatchEvent(new CustomEvent("reminders-updated"));
      window.dispatchEvent(new Event("sync-completed"));
    }

    this.notifyStatus();
  }
}

// Global Singleton Instance
export const syncEngine = new SyncEngine();

export default syncEngine;
