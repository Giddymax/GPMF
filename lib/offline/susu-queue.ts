"use client";

/**
 * IndexedDB-backed offline queue for susu collections. When an agent is out of
 * signal range, `queueContribution` stores the collection locally; `flushQueue`
 * (called on reconnect and periodically) replays everything through the real
 * server action once the network is back.
 */

const DB_NAME = "gpfs-offline";
const STORE_NAME = "susu-queue";
const DB_VERSION = 1;

export interface QueuedContribution {
  id: string;
  cycleId: string;
  agentId: string;
  amount: number;
  clientName: string;
  queuedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueContribution(entry: Omit<QueuedContribution, "id" | "queuedAt">): Promise<void> {
  const db = await openDb();
  const record: QueuedContribution = {
    ...entry,
    id: `${entry.cycleId}-${Date.now()}`,
    queuedAt: new Date().toISOString(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedContributions(): Promise<QueuedContribution[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as QueuedContribution[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedContribution(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
