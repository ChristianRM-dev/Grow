// src/hooks/useFormDraft.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import {
  saveDraft as saveDraftToStorage,
  loadDraft as loadDraftFromStorage,
  clearDraft as clearDraftFromStorage,
  getDraftMetadata,
  hasDraft as hasDraftInStorage,
} from "@/lib/draft-storage";

import type { UseFormDraftOptions, UseFormDraftReturn } from "./useFormDraft.types";

const DEFAULT_DEBOUNCE_MS = 1000;
const DEFAULT_EXPIRATION_DAYS = 7;

type ValidateMode = "none" | "safe" | "strict";

/**
 * A safer autosave strategy:
 * - Subscribe once via form.watch(callback)
 * - Debounce with setTimeout
 * - Dedupe using a JSON fingerprint to avoid saving the same payload repeatedly
 * - Optional schema validation mode for autosave (safe/strict/none)
 */
export function useFormDraft<T extends FieldValues>(
  options: UseFormDraftOptions<T> & {
    /**
     * Autosave validation behavior:
     * - "none": no validation on autosave (fast, but may store invalid drafts)
     * - "safe": schema.safeParse, skip save if invalid (recommended)
     * - "strict": schema.parse, throws if invalid (not recommended while typing)
     */
    validateMode?: ValidateMode;
  }
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
    validateMode = "safe",
  } = options;

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  // Keep a stable snapshot of "hasDraft" without forcing expensive recomputes on every save.
  // We'll refresh it when we know we saved/cleared or on init.
  const [hasDraftState, setHasDraftState] = useState<boolean>(() =>
    hasDraftInStorage(draftKey)
  );

  // Internal refs to avoid unnecessary renders and prevent re-entrant saves
  const isMountedRef = useRef(true);
  const isAutoSavingRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dedupe: store last saved fingerprint (json) to avoid infinite autosave loops
  const lastSavedJsonRef = useRef<string>("");

  // Also keep a ref for enabled to avoid stale closure edges in the watch callback
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Keep last saved schema ref to avoid re-subscribing when schema identity changes frequently
  const schemaRef = useRef(schema);
  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  const validateModeRef = useRef<ValidateMode>(validateMode);
  useEffect(() => {
    validateModeRef.current = validateMode;
  }, [validateMode]);

  const debounceMsRef = useRef(debounceMs);
  useEffect(() => {
    debounceMsRef.current = debounceMs;
  }, [debounceMs]);

  const expirationDaysRef = useRef(expirationDays);
  useEffect(() => {
    expirationDaysRef.current = expirationDays;
  }, [expirationDays]);

  // Public: whether a draft exists (stateful, updated on save/clear/init)
  const hasDraft = useMemo(() => hasDraftState, [hasDraftState]);

  /**
   * Load draft from storage (validates against schema if provided).
   */
  const loadDraft = useCallback((): T | null => {
    try {
      const result = loadDraftFromStorage<T>(draftKey);

      if (!result.success) {
        setDraftTimestamp(null);
        setHasDraftState(false);
        return null;
      }

      const { data, timestamp } = result.data;

      if (schemaRef.current) {
        const validation = schemaRef.current.safeParse(data);
        if (!validation.success) {
          // Invalid draft -> clear it
          clearDraftFromStorage(draftKey);
          setDraftTimestamp(null);
          setHasDraftState(false);

          onLoadError?.(new Error("Draft validation failed: schema mismatch"));
          return null;
        }

        setDraftTimestamp(timestamp);
        setHasDraftState(true);
        onLoad?.(validation.data as T);

        // Initialize dedupe fingerprint to prevent immediate re-save of the same payload
        try {
          lastSavedJsonRef.current = JSON.stringify(validation.data);
        } catch {
          // ignore fingerprint failures
        }

        return validation.data as T;
      }

      // No schema validation
      setDraftTimestamp(timestamp);
      setHasDraftState(true);
      onLoad?.(data);

      try {
        lastSavedJsonRef.current = JSON.stringify(data);
      } catch {
        // ignore
      }

      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error("Unknown error");
      onLoadError?.(errorObj);
      return null;
    }
  }, [draftKey, onLoad, onLoadError]);

  /**
   * Save draft to storage (manual trigger).
   */
  const saveDraft = useCallback(
    (data?: T) => {
      const dataToSave = data ?? (form.getValues() as T);

      // If called without explicit data, respect "dirty" guard to avoid saving pristine form
      if (!data && !form.formState.isDirty) return;

      try {
        setIsAutoSaving(true);
        isAutoSavingRef.current = true;

        const result = saveDraftToStorage(draftKey, dataToSave, {
          expirationDays: expirationDaysRef.current,
        });

        if (!result.success) {
          throw new Error(`Failed to save draft: ${result.error}`);
        }

        const { timestamp } = result.data;

        // Update dedupe fingerprint
        try {
          lastSavedJsonRef.current = JSON.stringify(dataToSave);
        } catch {
          // ignore
        }

        if (isMountedRef.current) {
          setLastSaved(new Date(timestamp));
          setDraftTimestamp(timestamp);
          setHasDraftState(true);
        }

        onAutoSave?.(dataToSave);
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error("Unknown error");
        onSaveError?.(errorObj);
      } finally {
        if (isMountedRef.current) {
          setIsAutoSaving(false);
          isAutoSavingRef.current = false;
        }
      }
    },
    [draftKey, form, onAutoSave, onSaveError]
  );

  /**
   * Clear draft from storage.
   */
  const clearDraft = useCallback(() => {
    try {
      clearDraftFromStorage(draftKey);
      if (isMountedRef.current) {
        setDraftTimestamp(null);
        setLastSaved(null);
        setHasDraftState(false);
      }
      lastSavedJsonRef.current = "";
    } catch (error) {
      // swallow, but you can log if you want
      // console.error(`[useFormDraft] Error clearing draft for key "${draftKey}":`, error);
    }
  }, [draftKey]);

  /**
   * Initialize: check for existing draft metadata and set hasInitialized.
   */
  useEffect(() => {
    const metadata = getDraftMetadata(draftKey);
    if (metadata && !metadata.isExpired) {
      setDraftTimestamp(metadata.timestamp);
      setHasDraftState(true);
    } else {
      setDraftTimestamp(null);
      setHasDraftState(false);
    }
    setHasInitialized(true);
  }, [draftKey]);

  /**
   * Autosave subscription (single subscription, debounced, deduped).
   */
  useEffect(() => {
    if (!hasInitialized) return;

    const subscription = (form as UseFormReturn<T>).watch((values) => {
      // Respect dynamic enabled flag
      if (!enabledRef.current) return;

      // Do not autosave if a save is currently in progress
      if (isAutoSavingRef.current) return;

      // Only autosave if form is dirty and has any dirty fields
      if (!form.formState.isDirty) return;
      const dirtyFields = form.formState.dirtyFields ?? {};
      if (Object.keys(dirtyFields).length === 0) return;

      // Reset debounce timer
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(() => {
        if (!enabledRef.current) return;
        if (isAutoSavingRef.current) return;

        try {
          let dataToSave: T = values as T;

          const currentSchema = schemaRef.current;
          const mode = validateModeRef.current;

          if (currentSchema) {
            if (mode === "strict") {
              dataToSave = currentSchema.parse(values) as T;
            } else if (mode === "safe") {
              const parsed = currentSchema.safeParse(values);
              if (!parsed.success) {
                // While typing, we skip saving invalid states to reduce noise + storage churn
                return;
              }
              dataToSave = parsed.data as T;
            }
          }

          // Dedupe by fingerprint
          let json = "";
          try {
            json = JSON.stringify(dataToSave);
          } catch {
            // If serialization fails, do not autosave (prevents potential loops)
            return;
          }

          if (json === lastSavedJsonRef.current) return;

          // Save to storage
          setIsAutoSaving(true);
          isAutoSavingRef.current = true;

          const result = saveDraftToStorage(draftKey, dataToSave, {
            expirationDays: expirationDaysRef.current,
          });

          if (!result.success) {
            throw new Error(`Failed to save draft: ${result.error}`);
          }

          const { timestamp } = result.data;
          lastSavedJsonRef.current = json;

          if (isMountedRef.current) {
            setLastSaved(new Date(timestamp));
            setDraftTimestamp(timestamp);
            setHasDraftState(true);
          }

          onAutoSave?.(dataToSave);
        } catch (error) {
          const errorObj =
            error instanceof Error ? error : new Error("Unknown error");
          onSaveError?.(errorObj);
        } finally {
          if (isMountedRef.current) {
            setIsAutoSaving(false);
            isAutoSavingRef.current = false;
          }
        }
      }, debounceMsRef.current);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [form, draftKey, hasInitialized, onAutoSave, onSaveError]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  /**
   * Optional metadata helper (kept for compatibility with your return type).
   */
  const getDraftInfo = useCallback(() => {
    try {
      const metadata = getDraftMetadata(draftKey);
      if (!metadata) return null;
      return {
        exists: true,
        timestamp: metadata.timestamp,
        isExpired: metadata.isExpired,
      };
    } catch {
      return null;
    }
  }, [draftKey]);

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
