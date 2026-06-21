"use client";
import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Warehouse,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Zap,
  Sparkles,
  Globe2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

interface StatsData {
  duasPendientes: number;
  duasProcesados: number;
  depositosActivos: number;
  unidadesEnDeposito: number;
  discrepancias: number;
  documentosPendientes: number;
  stockTotal: number;
  movimientosHoy: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color: string;
  href?: string;
  alert?: boolean;
}

function KPICard({ title, value, icon: Icon, trend, color, href, alert }: KPICardProps) {
  const content = (
    <Card glow className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] group ${alert ? "border-red-500/30" : ""}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br from-white/5 to-transparent -translate-y-10 translate-x-10" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {alert && <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse mt-1" />}
          {trend !== undefined && !alert && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-white mb-1">{typeof value === "number" ? formatNumber(value) : value}</p>
        <p className="text-sm text-slate-400">{title}</p>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

interface RecentActivity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  estado: string;
}

const MOCK_STATS: StatsData = {
  duasPendientes: 12,
  duasProcesados: 87,
  depositosActivos: 5,
  unidadesEnDeposito: 1247,
  discrepancias: 3,
  documentosPendientes: 8,
  stockTotal: 4580,
  movimientosHoy: 23,
};

const MOCK_ACTIVITY: RecentActivity[] = [
  { id: "1", tipo: "DUA", descripcion: "DUA-2024-0045 procesado y despachado", fecha: new Date().toISOString(), estado: "DESPACHADO" },
  { id: "2", tipo: "LAME", descripcion: "Entrada depósito — 50 unidades BMW X5", fecha: new Date(Date.now() - 3600000).toISOString(), estado: "ENTRADA" },
  { id: "3", tipo: "ALERTA", descripcion: "Stock insuficiente detectado: REF-2024-009", fecha: new Date(Date.now() - 7200000).toISOString(), estado: "ALERTA" },
  { id: "4", tipo: "DOC", descripcion: "Factura IT-2024-889 procesada por Claude OCR", fecha: new Date(Date.now() - 10800000).toISOString(), estado: "PROCESADO" },
  { id: "5", tipo: "DUA", descripcion: "DUA-2024-0046 en trámite aduanero", fecha: new Date(Date.now() - 14400000).toISOString(), estado: "EN_TRAMITE" },
  { id: "6", tipo: "INTRASTAT", descripcion: "3 registros Intrastat exportados — Período 04/2026", fecha: new Date(Date.now() - 21600000).toISOString(), estado: "PROCESADO" },
];

const activityBadge: Record<string, { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }> = {
  DESPACHADO: { variant: "success", label: "Despachado" },
  ENTRADA: { variant: "info", label: "Entrada" },
  ALERTA: { variant: "error", label: "Alerta" },
  PROCESADO: { variant: "neutral", label: "Procesado" },
  EN_TRAMITE: { variant: "warning", label: "En Trámite" },
};

const activityIcon: Record<string, React.ElementType> = {
  DUA: FileText,
  LAME: Package,
  ALERTA: AlertTriangle,
  DOC: Sparkles,
  INTRASTAT: Globe2,
};

export function DashboardContent() {
  const [stats, setStats] = useState<StatsData>(MOCK_STATS);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setStats(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Bienvenido a{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">AduanaSaaS</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats.discrepancias > 0 && (
            <Link href="/deposito" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300 font-medium">{stats.discrepancias} discrepancia{stats.discrepancias > 1 ? "s" : ""}</span>
            </Link>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">{stats.movimientosHoy} movimientos hoy</span>
          </div>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="DUAs Pendientes" value={stats.duasPendientes} icon={Clock} color="from-amber-500 to-orange-500" trend={-5} href="/duas" />
        <KPICard title="DUAs Despachados" value={stats.duasProcesados} icon={CheckCircle2} color="from-emerald-500 to-teal-500" trend={12} href="/duas" />
        <KPICard title="Depósitos Activos" value={stats.depositosActivos} icon={Warehouse} color="from-blue-500 to-indigo-500" href="/deposito" />
        <KPICard title="Unidades en Depósito" value={stats.unidadesEnDeposito} icon={Package} color="from-purple-500 to-pink-500" trend={8} href="/deposito" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Discrepancias" value={stats.discrepancias} icon={AlertTriangle} color="from-red-500 to-rose-500" alert={stats.discrepancias > 0} href="/deposito" />
        <KPICard title="Documentos Pendientes" value={stats.documentosPendientes} icon={FileText} color="from-cyan-500 to-sky-500" href="/documentos" />
        <KPICard title="Stock Total" value={stats.stockTotal} icon={Package} color="from-violet-500 to-purple-500" trend={3} />
        <KPICard title="Movimientos Hoy" value={stats.movimientosHoy} icon={Zap} color="from-yellow-500 to-amber-500" trend={15} />
      </div>

      {/* Charts */}
      <DashboardCharts />

      {/* Activity + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Actividad Reciente</CardTitle>
                <Badge variant="neutral">{MOCK_ACTIVITY.length} eventos</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {MOCK_ACTIVITY.map((item) => {
                  const badge = activityBadge[item.estado] || { variant: "neutral" as const, label: item.estado };
                  const IconComp = activityIcon[item.tipo] || FileText;
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <IconComp className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.descripcion}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(item.fecha)}</p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { href: "/documentos", label: "Subir Documento con IA", icon: Sparkles, color: "text-cyan-400" },
                { href: "/duas", label: "Nuevo DUA", icon: CheckCircle2, color: "text-emerald-400" },
                { href: "/lame", label: "Registrar Movimiento LAME", icon: Package, color: "text-purple-400" },
                { href: "/deposito", label: "Control de Stock", icon: Warehouse, color: "text-blue-400" },
                { href: "/intrastat", label: "Declaración Intrastat", icon: Globe2, color: "text-amber-400" },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Claude AI / OCR", ok: true },
                { label: "Base de Datos", ok: true },
                { label: "Motor de Cruce", ok: true },
                { label: "Sync Depósito", ok: stats.discrepancias === 0 },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400 animate-pulse" : "bg-red-400 animate-pulse"}`} />
                    <span className={`text-xs font-medium ${ok ? "text-emerald-400" : "text-red-400"}`}>
                      {ok ? "Operativo" : "Alerta"}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
