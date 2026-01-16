/**
 * useFormDraft Hook
 *
 * Manages automatic draft saving for React Hook Form forms.
 * Integrates with localStorage to persist form state across sessions.
 *
 * Features:
 * - Auto-save with configurable debounce
 * - Load draft on initialization
 * - Schema validation for loaded drafts
 * - Expiration handling
 * - Type-safe with React Hook Form
 *
 * @example
 * ```typescript
 * const form = useForm<FormData>();
 * const draft = useFormDraft({
 *   draftKey: 'sales-note:new',
 *   form,
 *   schema: SalesNoteFormSchema,
 * });
 *
 * // Check if draft exists
 * if (draft.hasDraft) {
 *   // Show restore dialog
 * }
 *
 * // Load draft
 * const data = draft.loadDraft();
 * if (data) {
 *   form.reset(data);
 * }
 *
 * // Clear draft on successful submit
 * draft.clearDraft();
 * ```
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";

import {
  saveDraft as saveDraftToStorage,
  loadDraft as loadDraftFromStorage,
  clearDraft as clearDraftFromStorage,
  getDraftMetadata,
  hasDraft as hasDraftInStorage,
} from "@/lib/draft-storage";

import { useDebounce } from "./useDebounce";
import type {
  UseFormDraftOptions,
  UseFormDraftReturn,
} from "./useFormDraft.types";

const DEFAULT_DEBOUNCE_MS = 1000;
const DEFAULT_EXPIRATION_DAYS = 7;

/**
 * Hook for managing form drafts with auto-save
 */
export function useFormDraft<T extends FieldValues>(
  options: UseFormDraftOptions<T>
): UseFormDraftReturn<T> {
  const {
    draftKey,
    form,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    schema,
    expirationDays = DEFAULT_EXPIRATION_DAYS,
    onAutoSave,
    onSaveError,
    onLoad,
    onLoadError,
  } = options;

  // State
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  // Refs to prevent unnecessary re-renders
  const isAutoSavingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Watch form values for auto-save
  const formValues = useWatch({ control: form.control }) as T;
  const debouncedFormValues = useDebounce(formValues, debounceMs);

  // Check if draft exists (memoized)
  const hasDraft = useMemo(() => {
    return hasDraftInStorage(draftKey);
  }, [draftKey, lastSaved]); // Re-check when lastSaved changes

  /**
   * Load draft from storage
   */
  const loadDraft = useCallback((): T | null => {
    try {
      const result = loadDraftFromStorage<T>(draftKey);

      if (!result.success) {
        // Draft not found, expired, or corrupted
        setDraftTimestamp(null);
        return null;
      }

      const { data, timestamp } = result.data;

      // Validate with schema if provided
      if (schema) {
        const validation = schema.safeParse(data);
        if (!validation.success) {
          console.warn(
            `[useFormDraft] Draft validation failed for key "${draftKey}":`,
            validation.error
          );

          // Clear invalid draft
          clearDraftFromStorage(draftKey);
          setDraftTimestamp(null);

          onLoadError?.(new Error("Draft validation failed: schema mismatch"));

          return null;
        }

        // Use validated data
        setDraftTimestamp(timestamp);
        onLoad?.(validation.data as T);
        return validation.data as T;
      }

      // No schema validation - use data as-is
      setDraftTimestamp(timestamp);
      onLoad?.(data);
      return data;
    } catch (error) {
      console.error(
        `[useFormDraft] Error loading draft for key "${draftKey}":`,
        error
      );

      const errorObj =
        error instanceof Error ? error : new Error("Unknown error");
      onLoadError?.(errorObj);

      return null;
    }
  }, [draftKey, schema, onLoad, onLoadError]);

  /**
   * Save draft to storage
   */
  const saveDraft = useCallback(
    (data?: T) => {
      const dataToSave = data ?? form.getValues();

      // Don't save if form is pristine (no changes)
      if (!data && !form.formState.isDirty) {
        return;
      }

      try {
        setIsAutoSaving(true);
        isAutoSavingRef.current = true;

        const result = saveDraftToStorage(draftKey, dataToSave, {
          expirationDays,
        });

        if (!result.success) {
          throw new Error(`Failed to save draft: ${result.error}`);
        }

        const { timestamp } = result.data;

        if (isMountedRef.current) {
          setLastSaved(new Date(timestamp));
          setDraftTimestamp(timestamp);
        }

        onAutoSave?.(dataToSave);
      } catch (error) {
        console.error(
          `[useFormDraft] Error saving draft for key "${draftKey}":`,
          error
        );

        const errorObj =
          error instanceof Error ? error : new Error("Unknown error");
        onSaveError?.(errorObj);
      } finally {
        if (isMountedRef.current) {
          setIsAutoSaving(false);
          isAutoSavingRef.current = false;
        }
      }
    },
    [draftKey, form, expirationDays, onAutoSave, onSaveError]
  );

  /**
   * Clear draft from storage
   */
  const clearDraft = useCallback(() => {
    try {
      clearDraftFromStorage(draftKey);
      setDraftTimestamp(null);
      setLastSaved(null);
    } catch (error) {
      console.error(
        `[useFormDraft] Error clearing draft for key "${draftKey}":`,
        error
      );
    }
  }, [draftKey]);

  /**
   * Get draft metadata without loading data
   */
  const getDraftInfo = useCallback(() => {
    try {
      const metadata = getDraftMetadata(draftKey);
      if (!metadata) {
        return null;
      }

      return {
        exists: true,
        timestamp: metadata.timestamp,
        isExpired: metadata.isExpired,
      };
    } catch {
      return null;
    }
  }, [draftKey]);

  /**
   * Initialize: Check for existing draft
   */
  useEffect(() => {
    // Update timestamp if draft exists
    const metadata = getDraftMetadata(draftKey);
    if (metadata && !metadata.isExpired) {
      setDraftTimestamp(metadata.timestamp);
    }

    setHasInitialized(true);
  }, [draftKey]);

  /**
   * Auto-save when debounced form values change
   */
  useEffect(() => {
    if (!enabled) return;
    if (!hasInitialized) return;
    if (isAutoSavingRef.current) return;

    // Only auto-save if form is dirty
    if (!form.formState.isDirty) return;

    // Don't save on initial mount (debounced values will be initial values)
    // We check if there are any actual changes
    const hasChanges = Object.keys(form.formState.dirtyFields).length > 0;
    if (!hasChanges) return;

    saveDraft(debouncedFormValues);
  }, [
    debouncedFormValues,
    enabled,
    hasInitialized,
    form.formState.isDirty,
    form.formState.dirtyFields,
    saveDraft,
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    hasDraft,
    draftTimestamp,
    isAutoSaving,
    lastSaved,
    hasInitialized,
    loadDraft,
    clearDraft,
    saveDraft,
    getDraftInfo,
  };
}
