"use client";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AlertProps {
  type: "success" | "warning" | "error" | "info";
  title?: string;
  message: string;
  dismissible?: boolean;
  className?: string;
}

const config = {
  success: { icon: CheckCircle, colors: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" },
  warning: { icon: AlertTriangle, colors: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
  error: { icon: XCircle, colors: "bg-red-500/10 border-red-500/30 text-red-300" },
  info: { icon: Info, colors: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" },
};

export function Alert({ type, title, message, dismissible, className }: AlertProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const { icon: Icon, colors } = config[type];

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border", colors, className)}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-sm mb-0.5">{title}</p>}
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {dismissible && (
        <button onClick={() => setVisible(false)} className="p-0.5 hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
