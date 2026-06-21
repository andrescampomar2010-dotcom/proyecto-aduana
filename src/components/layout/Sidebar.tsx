"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileUp,
  FileText,
  Package,
  Warehouse,
  Globe2,
  Settings,
  ChevronRight,
  Anchor,
  ArrowRightLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documentos", label: "Documentos", icon: FileUp },
  { href: "/duas", label: "DUAs", icon: FileText },
  { href: "/lame", label: "LAME / DVD", icon: ArrowRightLeft },
  { href: "/deposito", label: "Depósito", icon: Warehouse },
  { href: "/intrastat", label: "Intrastat", icon: Globe2 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col bg-[#080b12] border-r border-white/5 z-40">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Anchor className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">AduanaSaaS</p>
          <p className="text-xs text-slate-500 mt-0.5">Plataforma Aduanera</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Módulos</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group border",
                active
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/20 shadow-sm shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-500 rounded-r-full" />
              )}
              <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", active ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1 font-medium">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Status badge */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Sistema activo</span>
        </div>
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-purple-500/20">
            OP
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Operador</p>
            <p className="text-xs text-slate-500 truncate">admin@aduana.es</p>
          </div>
          <Shield className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
