import { addToast } from "./toastStore";

export const toast = {
  success: (
    message: string,
    options?: { title?: string; durationMs?: number; dismissible?: boolean }
  ) => addToast("success", message, options),
  error: (
    message: string,
    options?: { title?: string; durationMs?: number; dismissible?: boolean }
  ) => addToast("error", message, options),
  warning: (
    message: string,
    options?: { title?: string; durationMs?: number; dismissible?: boolean }
  ) => addToast("warning", message, options),
  info: (
    message: string,
    options?: { title?: string; durationMs?: number; dismissible?: boolean }
  ) => addToast("info", message, options),
};
