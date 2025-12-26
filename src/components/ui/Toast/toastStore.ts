import type { ToastItem, ToastVariant } from "./toast.types";

type ToastListener = () => void;

type AddToastInput = Omit<ToastItem, "id"> & { id?: string };

const DEFAULT_DURATION_MS = 3500;

function createId(): string {
  // Good enough for UI toasts; avoids bringing a UUID dependency.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

class ToastStore {
  private toasts: ToastItem[] = [];
  private listeners = new Set<ToastListener>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.toasts;
  }

  add(input: AddToastInput): string {
    const id = input.id ?? createId();
    const toast: ToastItem = {
      id,
      variant: input.variant,
      message: input.message,
      title: input.title,
      durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
      dismissible: input.dismissible ?? true,
    };

    // Newest on top
    this.toasts = [toast, ...this.toasts].slice(0, 5);
    this.emit();

    if (toast.durationMs && toast.durationMs > 0) {
      const timer = setTimeout(() => this.dismiss(id), toast.durationMs);
      this.timers.set(id, timer);
    }

    return id;
  }

  dismiss(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    const next = this.toasts.filter((t) => t.id !== id);
    if (next.length !== this.toasts.length) {
      this.toasts = next;
      this.emit();
    }
  }

  clear() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.toasts = [];
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l();
  }
}

export const toastStore = new ToastStore();

export function addToast(
  variant: ToastVariant,
  message: string,
  options?: Omit<AddToastInput, "variant" | "message">
) {
  return toastStore.add({ variant, message, ...options });
}
