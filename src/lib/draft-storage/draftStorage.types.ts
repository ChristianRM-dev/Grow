/**
 * Draft Storage Types
 *
 * Type definitions for the draft storage system.
 */

/**
 * Stored draft data structure
 */
export interface StoredDraft<T = unknown> {
  /** The actual form data */
  data: T;
  /** ISO timestamp when draft was saved */
  timestamp: string;
  /** ISO timestamp when draft expires */
  expiresAt: string;
  /** Schema version for future migrations */
  schemaVersion?: number;
}

/**
 * Options for saving a draft
 */
export interface SaveDraftOptions {
  /** Number of days until draft expires (default: 7) */
  expirationDays?: number;
  /** Schema version to tag the draft with */
  schemaVersion?: number;
}

/**
 * Options for loading a draft
 */
export interface LoadDraftOptions {
  /** Whether to remove expired drafts (default: true) */
  removeExpired?: boolean;
  /** Custom validation function */
  validator?: (data: unknown) => boolean;
}

/**
 * Result of a draft operation
 */
export type DraftResult<T> =
  | { success: true; data: T }
  | { success: false; error: DraftError };

/**
 * Draft-specific errors
 */
export enum DraftError {
  NOT_FOUND = "draft_not_found",
  EXPIRED = "draft_expired",
  CORRUPTED = "draft_corrupted",
  QUOTA_EXCEEDED = "draft_quota_exceeded",
  VALIDATION_FAILED = "draft_validation_failed",
  STORAGE_UNAVAILABLE = "draft_storage_unavailable",
}

/**
 * Draft metadata without the data payload
 */
export interface DraftMetadata {
  /** Draft key */
  key: string;
  /** ISO timestamp when draft was saved */
  timestamp: string;
  /** ISO timestamp when draft expires */
  expiresAt: string;
  /** Whether the draft has expired */
  isExpired: boolean;
  /** Size in bytes (approximate) */
  sizeBytes: number;
}
