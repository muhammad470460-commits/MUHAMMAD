import type { UserProfile } from '../types';

export const AUTH_TOKEN_KEY = 'nbv_trading_auth_token';
const CACHED_USER_KEY = 'nbv_trading_cached_user';
const DEVICE_REGISTERED_FLAG_KEY = 'nbv_trading_device_has_account';

const IDB_NAME = 'nbv_trading_auth_db';
const IDB_STORE = 'auth_kv';
const IDB_VERSION = 1;

function openAuthIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openAuthIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openAuthIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openAuthIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

function safeLocalGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, val: string): void {
  try {
    window.localStorage.setItem(key, val);
  } catch {
    // Ignore storage quota or iframe restrictions; IndexedDB + HttpOnly cookie provide fallback
  }
}

function safeLocalRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function getSyncAuthToken(): string {
  return safeLocalGet(AUTH_TOKEN_KEY) || '';
}

export function getSyncCachedUser(): UserProfile | null {
  const raw = safeLocalGet(CACHED_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function getSyncDeviceHasAccount(): boolean {
  return safeLocalGet(DEVICE_REGISTERED_FLAG_KEY) === '1';
}

export async function persistAuthSession(token: string, user: UserProfile): Promise<void> {
  safeLocalSet(AUTH_TOKEN_KEY, token);
  safeLocalSet(CACHED_USER_KEY, JSON.stringify(user));
  safeLocalSet(DEVICE_REGISTERED_FLAG_KEY, '1');
  await Promise.all([
    idbSet(AUTH_TOKEN_KEY, token),
    idbSet(CACHED_USER_KEY, user),
    idbSet(DEVICE_REGISTERED_FLAG_KEY, '1'),
  ]);
}

export async function updateCachedUserProfile(user: UserProfile): Promise<void> {
  safeLocalSet(CACHED_USER_KEY, JSON.stringify(user));
  await idbSet(CACHED_USER_KEY, user);
}

export async function clearAuthSession(): Promise<void> {
  safeLocalRemove(AUTH_TOKEN_KEY);
  safeLocalRemove(CACHED_USER_KEY);
  await Promise.all([idbDelete(AUTH_TOKEN_KEY), idbDelete(CACHED_USER_KEY)]);
}

export async function loadPersistedSessionFromDevice(): Promise<{
  token: string;
  cachedUser: UserProfile | null;
  deviceHasAccount: boolean;
}> {
  let token = getSyncAuthToken();
  let cachedUser = getSyncCachedUser();
  let deviceHasAccount = getSyncDeviceHasAccount();

  if (!token) {
    const idbToken = await idbGet<string>(AUTH_TOKEN_KEY);
    if (typeof idbToken === 'string' && idbToken) {
      token = idbToken;
      safeLocalSet(AUTH_TOKEN_KEY, token);
    }
  }

  if (!cachedUser) {
    const idbUser = await idbGet<UserProfile>(CACHED_USER_KEY);
    if (idbUser && typeof idbUser === 'object' && idbUser.id) {
      cachedUser = idbUser;
      safeLocalSet(CACHED_USER_KEY, JSON.stringify(idbUser));
    }
  }

  if (!deviceHasAccount) {
    const idbFlag = await idbGet<string>(DEVICE_REGISTERED_FLAG_KEY);
    if (idbFlag === '1') {
      deviceHasAccount = true;
      safeLocalSet(DEVICE_REGISTERED_FLAG_KEY, '1');
    }
  }

  return { token, cachedUser, deviceHasAccount };
}
