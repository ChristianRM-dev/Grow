/**
 * useFormDraft Types
 *
 * Type definitions for the form draft hook.
 */

import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodSchema } from "zod";

/**
 * Options for useFormDraft hook
 */
export interface UseFormDraftOptions<T extends FieldValues> {
  /**
   * Unique key to identify this draft in storage
   * @example 'sales-note:new' or 'quotation:edit:123'
   */
  draftKey: string;

  /**
   * React Hook Form instance
   */
  form: UseFormReturn<T>;

  /**
   * Whether auto-save is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Debounce delay in milliseconds before auto-saving
   * @default 1000
   */
  debounceMs?: number;

  /**
   * Zod schema to validate drafts when loading
   * If validation fails, draft is discarded
   */
  schema?: ZodSchema<T>;

  /**
   * Number of days until draft expires
   * @default 7
   */
  expirationDays?: number;

  /**
   * Callback when draft is auto-saved
   */
  onAutoSave?: (data: T) => void;

  /**
   * Callback when draft save fails
   */
  onSaveError?: (error: Error) => void;

  /**
   * Callback when draft is loaded
   */
  onLoad?: (data: T) => void;

  /**
   * Callback when draft load fails
   */
  onLoadError?: (error: Error) => void;
}

/**
 * Return type of useFormDraft hook
 */
export interface UseFormDraftReturn<T extends FieldValues> {
  /**
   * Whether a valid draft exists in storage
   */
  hasDraft: boolean;

  /**
   * Timestamp when draft was last saved (ISO string)
   * null if no draft exists
   */
  draftTimestamp: string | null;

  /**
   * Whether auto-save is currently in progress
   */
  isAutoSaving: boolean;

  /**
   * When the draft was last saved (Date object)
   * null if never saved or no draft
   */
  lastSaved: Date | null;

  /**
   * Whether the hook has finished initialization
   * (checking for existing draft, etc.)
   */
  hasInitialized: boolean;

  /**
   * Load draft from storage
   * Returns the draft data or null if not found/invalid
   */
  loadDraft: () => T | null;

  /**
   * Clear draft from storage
   */
  clearDraft: () => void;

  /**
   * Manually save current form values as draft
   * (usually auto-save handles this)
   */
  saveDraft: (data?: T) => void;

  /**
   * Get metadata about the draft without loading it
   */
  getDraftInfo: () => {
    exists: boolean;
    timestamp: string | null;
    isExpired: boolean;
  } | null;
}
