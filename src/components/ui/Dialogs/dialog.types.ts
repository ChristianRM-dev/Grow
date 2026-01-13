import type React from "react";

export type DialogPreset = "confirm" | "warning" | "error" | "success" | "info";
export type DialogTone = "info" | "success" | "warning" | "danger";
export type DialogKind = "alert" | "confirm";

export type DialogLabels = {
  confirmText?: string; // Spanish UI text
  cancelText?: string; // Spanish UI text
};

export type DialogIconOptions = {
  /**
   * Override icon. If provided, it replaces the default preset icon.
   */
  icon?: React.ReactNode;

  /**
   * Hide icon entirely (even if a default exists).
   */
  hideIcon?: boolean;
};

export type BaseDialogOptions = {
  preset?: DialogPreset;

  title?: string; // Spanish UI text (optional; preset may provide default)
  message: React.ReactNode; // Spanish UI text
  details?: string | null; // Optional technical details

  labels?: DialogLabels;
  iconOptions?: DialogIconOptions;

  /**
   * Allow closing with Escape/backdrop cancel.
   * For destructive confirms you may choose to disable it.
   */
  allowEscClose?: boolean;
};

export type ConfirmDialogOptions = BaseDialogOptions & {
  kind?: "confirm";
  /**
   * Optional: makes confirm look/behave more dangerous by default
   * (tone + default labels can come from preset anyway).
   */
  toneOverride?: DialogTone;
};

export type AlertDialogOptions = BaseDialogOptions & {
  kind?: "alert";
  toneOverride?: DialogTone;
};

export type DialogRequest = {
  id: string;
  kind: DialogKind;
  preset: DialogPreset;
  tone: DialogTone;

  title: string;
  message: React.ReactNode;
  details: string | null;

  labels: Required<DialogLabels>;
  icon: React.ReactNode | null;

  allowEscClose: boolean;
};
