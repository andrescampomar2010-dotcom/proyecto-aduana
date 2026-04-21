import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatCurrency(value: number | null | undefined, currency = "EUR"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-ES").format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const DUA_STATUS_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  EN_TRAMITE: "En Trámite",
  DESPACHADO: "Despachado",
  RECHAZADO: "Rechazado",
  CANCELADO: "Cancelado",
};

export const DUA_STATUS_COLORS: Record<string, string> = {
  BORRADOR: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  PENDIENTE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  EN_TRAMITE: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  DESPACHADO: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  RECHAZADO: "bg-red-500/20 text-red-300 border-red-500/30",
  CANCELADO: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PROCESANDO: "Procesando",
  PROCESADO: "Procesado",
  ERROR: "Error",
  VALIDADO: "Validado",
};

export const DOC_STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PROCESANDO: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PROCESADO: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ERROR: "bg-red-500/20 text-red-300 border-red-500/30",
  VALIDADO: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
  RESERVA: "Reserva",
};
