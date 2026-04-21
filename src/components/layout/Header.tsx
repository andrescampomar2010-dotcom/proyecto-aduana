"use client";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/documentos": "Gestión Documental",
  "/duas": "DUAs",
  "/lame": "LAME / DVD",
  "/deposito": "Control de Depósito",
  "/intrastat": "Declaraciones Intrastat",
  "/configuracion": "Configuración",
};

export function Header() {
  const pathname = usePathname();
  const base = "/" + pathname.split("/")[1];
  const title = titles[base] || "AduanaSaaS";

  return (
    <header className="fixed top-0 left-64 right-0 h-16 flex items-center gap-4 px-6 bg-[#080b12]/80 backdrop-blur-xl border-b border-white/5 z-30">
      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar..."
          className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 w-56 transition-all"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500" />
      </button>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-emerald-400 font-medium">Sistema activo</span>
      </div>
    </header>
  );
}
