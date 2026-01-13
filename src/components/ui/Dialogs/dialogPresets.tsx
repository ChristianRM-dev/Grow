import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import type { DialogPreset, DialogTone, DialogLabels } from "./dialog.types";

type PresetConfig = {
  tone: DialogTone;
  defaultTitle: string; // Spanish UI text
  defaultLabels: Required<DialogLabels>; // Spanish UI text
  defaultIcon: React.ReactNode;
};

const ICON_CLASS = "h-6 w-6";

const presets: Record<DialogPreset, PresetConfig> = {
  confirm: {
    tone: "warning",
    defaultTitle: "Confirmar acción",
    defaultLabels: { confirmText: "Confirmar", cancelText: "Cancelar" },
    defaultIcon: <ExclamationTriangleIcon className={ICON_CLASS} />,
  },
  warning: {
    tone: "warning",
    defaultTitle: "Atención",
    defaultLabels: { confirmText: "Entendido", cancelText: "Cancelar" },
    defaultIcon: <ExclamationTriangleIcon className={ICON_CLASS} />,
  },
  error: {
    tone: "danger",
    defaultTitle: "Ocurrió un error",
    defaultLabels: { confirmText: "Entendido", cancelText: "Cancelar" },
    defaultIcon: <XCircleIcon className={ICON_CLASS} />,
  },
  success: {
    tone: "success",
    defaultTitle: "Listo",
    defaultLabels: { confirmText: "Continuar", cancelText: "Cancelar" },
    defaultIcon: <CheckCircleIcon className={ICON_CLASS} />,
  },
  info: {
    tone: "info",
    defaultTitle: "Información",
    defaultLabels: { confirmText: "Entendido", cancelText: "Cancelar" },
    defaultIcon: <InformationCircleIcon className={ICON_CLASS} />,
  },
};

export function resolvePresetConfig(preset: DialogPreset): PresetConfig {
  return presets[preset];
}
