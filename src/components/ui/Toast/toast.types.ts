export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  message: string;
  title?: string;
  durationMs?: number; // default: 3500
  dismissible?: boolean; // default: true
};
