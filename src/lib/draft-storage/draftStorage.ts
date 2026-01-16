/**
 * Draft Storage Utilities
 *
 * Pure functions for managing form drafts in localStorage.
 * Thread-safe, handles errors gracefully, and provides type safety.
 */

import type {
  DraftError,
  DraftMetadata,
  DraftResult,
  LoadDraftOptions,
  SaveDraftOptions,
  StoredDraft,
} from "./draftStorage.types";

const DEFAULT_EXPIRATION_DAYS = 7;
const DRAFT_KEY_PREFIX = "draft:";

/**
 * Calculate expiration date from now
 */
function calculateExpiresAt(days: number = DEFAULT_EXPIRATION_DAYS): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

/**
 * Check if a timestamp is expired
 */
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Build full storage key with prefix
 */
function buildStorageKey(draftKey: string): string {
  // Ensure key doesn't already have prefix
  if (draftKey.startsWith(DRAFT_KEY_PREFIX)) {
    return draftKey;
  }
  return `${DRAFT_KEY_PREFIX}${draftKey}`;
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get approximate size of a value in bytes
 */
function getByteSize(value: string): number {
  // Approximation: 2 bytes per character (UTF-16)
  return value.length * 2;
}

/**
 * Save a draft to localStorage
 *
 * @param draftKey - Unique identifier for this draft
 * @param data - Form data to save
 * @param options - Save options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = saveDraft('sales-note:new', formData, { expirationDays: 7 });
 * if (result.success) {
 *   console.log('Draft saved:', result.data);
 * }
 * ```
 */
export function saveDraft<T>(
  draftKey: string,
  data: T,
  options: SaveDraftOptions = {}
): DraftResult<StoredDraft<T>> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: "draft_storage_unavailable" as DraftError,
    };
  }

  const { expirationDays = DEFAULT_EXPIRATION_DAYS, schemaVersion } = options;

  try {
    const now = new Date().toISOString();
    const storedDraft: StoredDraft<T> = {
      data,
      timestamp: now,
      expiresAt: calculateExpiresAt(expirationDays),
      schemaVersion,
    };

    const serialized = JSON.stringify(storedDraft);
    const storageKey = buildStorageKey(draftKey);

    localStorage.setItem(storageKey, serialized);

    return {
      success: true,
      data: storedDraft,
    };
  } catch (error) {
    // Check if quota exceeded
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      // Try to clean up expired drafts and retry once
      cleanupExpiredDrafts();

      try {
        const now = new Date().toISOString();
        const storedDraft: StoredDraft<T> = {
          data,
          timestamp: now,
          expiresAt: calculateExpiresAt(expirationDays),
          schemaVersion,
        };

        const serialized = JSON.stringify(storedDraft);
        const storageKey = buildStorageKey(draftKey);

        localStorage.setItem(storageKey, serialized);

        return {
          success: true,
          data: storedDraft,
        };
      } catch {
        return {
          success: false,
          error: "draft_quota_exceeded" as DraftError,
        };
      }
    }

    return {
      success: false,
      error: "draft_storage_unavailable" as DraftError,
    };
  }
}

/**
 * Load a draft from localStorage
 *
 * @param draftKey - Unique identifier for the draft
 * @param options - Load options
 * @returns Result with draft data or error
 *
 * @example
 * ```typescript
 * const result = loadDraft<SalesNoteFormData>('sales-note:new');
 * if (result.success) {
 *   form.reset(result.data.data);
 * }
 * ```
 */
export function loadDraft<T>(
  draftKey: string,
  options: LoadDraftOptions = {}
): DraftResult<StoredDraft<T>> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: "draft_storage_unavailable" as DraftError,
    };
  }

  const { removeExpired = true, validator } = options;

  try {
    const storageKey = buildStorageKey(draftKey);
    const serialized = localStorage.getItem(storageKey);

    if (!serialized) {
      return {
        success: false,
        error: "draft_not_found" as DraftError,
      };
    }

    const parsed = JSON.parse(serialized) as StoredDraft<T>;

    // Validate structure
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.data ||
      !parsed.timestamp ||
      !parsed.expiresAt
    ) {
      // Corrupted draft - remove it
      localStorage.removeItem(storageKey);
      return {
        success: false,
        error: "draft_corrupted" as DraftError,
      };
    }

    // Check expiration
    if (isExpired(parsed.expiresAt)) {
      if (removeExpired) {
        localStorage.removeItem(storageKey);
      }
      return {
        success: false,
        error: "draft_expired" as DraftError,
      };
    }

    // Custom validation
    if (validator && !validator(parsed.data)) {
      return {
        success: false,
        error: "draft_validation_failed" as DraftError,
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch {
    // Parsing error - corrupted draft
    const storageKey = buildStorageKey(draftKey);
    localStorage.removeItem(storageKey);

    return {
      success: false,
      error: "draft_corrupted" as DraftError,
    };
  }
}

/**
 * Clear a specific draft from localStorage
 *
 * @param draftKey - Unique identifier for the draft
 * @returns True if draft existed and was removed
 *
 * @example
 * ```typescript
 * clearDraft('sales-note:new');
 * ```
 */
export function clearDraft(draftKey: string): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const storageKey = buildStorageKey(draftKey);
    const existed = localStorage.getItem(storageKey) !== null;
    localStorage.removeItem(storageKey);
    return existed;
  } catch {
    return false;
  }
}

/**
 * Check if a draft exists (without loading it)
 *
 * @param draftKey - Unique identifier for the draft
 * @param checkExpired - Whether to return false for expired drafts (default: true)
 * @returns True if draft exists and is not expired
 *
 * @example
 * ```typescript
 * if (hasDraft('sales-note:new')) {
 *   // Show restore dialog
 * }
 * ```
 */
export function hasDraft(
  draftKey: string,
  checkExpired: boolean = true
): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const storageKey = buildStorageKey(draftKey);
    const serialized = localStorage.getItem(storageKey);

    if (!serialized) {
      return false;
    }

    if (!checkExpired) {
      return true;
    }

    // Parse to check expiration
    const parsed = JSON.parse(serialized) as StoredDraft<unknown>;

    if (!parsed.expiresAt) {
      // Invalid structure
      return false;
    }

    return !isExpired(parsed.expiresAt);
  } catch {
    return false;
  }
}

/**
 * Get metadata about a draft without loading its data
 *
 * @param draftKey - Unique identifier for the draft
 * @returns Draft metadata or null if not found
 *
 * @example
 * ```typescript
 * const metadata = getDraftMetadata('sales-note:new');
 * if (metadata) {
 *   console.log('Draft saved:', new Date(metadata.timestamp));
 * }
 * ```
 */
export function getDraftMetadata(draftKey: string): DraftMetadata | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const storageKey = buildStorageKey(draftKey);
    const serialized = localStorage.getItem(storageKey);

    if (!serialized) {
      return null;
    }

    const parsed = JSON.parse(serialized) as StoredDraft<unknown>;

    if (!parsed.timestamp || !parsed.expiresAt) {
      return null;
    }

    return {
      key: draftKey,
      timestamp: parsed.timestamp,
      expiresAt: parsed.expiresAt,
      isExpired: isExpired(parsed.expiresAt),
      sizeBytes: getByteSize(serialized),
    };
  } catch {
    return null;
  }
}

/**
 * List all draft keys with optional prefix filter
 *
 * @param prefix - Optional prefix to filter drafts (e.g., 'sales-note:')
 * @returns Array of draft keys
 *
 * @example
 * ```typescript
 * const salesDrafts = listDrafts('sales-note:');
 * console.log('Found drafts:', salesDrafts);
 * ```
 */
export function listDrafts(prefix?: string): string[] {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const keys: string[] = [];
    const fullPrefix = prefix ? buildStorageKey(prefix) : DRAFT_KEY_PREFIX;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        // Remove the DRAFT_KEY_PREFIX to return clean keys
        const cleanKey = key.substring(DRAFT_KEY_PREFIX.length);
        keys.push(cleanKey);
      }
    }

    return keys;
  } catch {
    return [];
  }
}

/**
 * Clean up all expired drafts from localStorage
 *
 * @returns Number of drafts removed
 *
 * @example
 * ```typescript
 * const removed = cleanupExpiredDrafts();
 * console.log(`Removed ${removed} expired drafts`);
 * ```
 */
export function cleanupExpiredDrafts(): number {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    let removed = 0;
    const keysToRemove: string[] = [];

    // Collect keys to remove (can't modify during iteration)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) {
        continue;
      }

      try {
        const serialized = localStorage.getItem(key);
        if (!serialized) continue;

        const parsed = JSON.parse(serialized) as StoredDraft<unknown>;

        if (parsed.expiresAt && isExpired(parsed.expiresAt)) {
          keysToRemove.push(key);
        }
      } catch {
        // Corrupted draft - mark for removal
        keysToRemove.push(key);
      }
    }

    // Remove collected keys
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      removed++;
    }

    return removed;
  } catch {
    return 0;
  }
}

/**
 * Clear ALL drafts from localStorage (use with caution!)
 *
 * @param prefix - Optional prefix to clear only specific drafts
 * @returns Number of drafts cleared
 *
 * @example
 * ```typescript
 * // Clear only sales note drafts
 * clearAllDrafts('sales-note:');
 *
 * // Clear ALL drafts
 * clearAllDrafts();
 * ```
 */
export function clearAllDrafts(prefix?: string): number {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    const draftKeys = listDrafts(prefix);
    let cleared = 0;

    for (const key of draftKeys) {
      if (clearDraft(key)) {
        cleared++;
      }
    }

    return cleared;
  } catch {
    return 0;
  }
}
