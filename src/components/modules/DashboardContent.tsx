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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatNumber } from "@/lib/utils";
import Link from "next/link";

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
    <Card glow className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${alert ? "border-red-500/30" : ""}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent -translate-y-8 translate-x-8" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {alert && <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />}
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

  if (href) return <Link href={href}>{content}</Link>;
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
  { id: "1", tipo: "DUA", descripcion: "DUA-2024-0045 procesado", fecha: new Date().toISOString(), estado: "DESPACHADO" },
  { id: "2", tipo: "LAME", descripcion: "Entrada depósito — 50 unidades BMW X5", fecha: new Date(Date.now() - 3600000).toISOString(), estado: "ENTRADA" },
  { id: "3", tipo: "ALERTA", descripcion: "Stock insuficiente: REF-2024-009", fecha: new Date(Date.now() - 7200000).toISOString(), estado: "ALERTA" },
  { id: "4", tipo: "DOC", descripcion: "Factura IT-2024-889 procesada por OCR", fecha: new Date(Date.now() - 10800000).toISOString(), estado: "PROCESADO" },
  { id: "5", tipo: "DUA", descripcion: "DUA-2024-0046 en trámite", fecha: new Date(Date.now() - 14400000).toISOString(), estado: "EN_TRAMITE" },
];

const activityBadge: Record<string, { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }> = {
  DESPACHADO: { variant: "success", label: "Despachado" },
  ENTRADA: { variant: "info", label: "Entrada" },
  ALERTA: { variant: "error", label: "Alerta" },
  PROCESADO: { variant: "neutral", label: "Procesado" },
  EN_TRAMITE: { variant: "warning", label: "En Trámite" },
};

export function DashboardContent() {
  const [stats, setStats] = useState<StatsData>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setStats(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Bienvenido a <span className="text-cyan-400">AduanaSaaS</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-300 font-medium">{stats.movimientosHoy} movimientos hoy</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="DUAs Pendientes"
          value={stats.duasPendientes}
          icon={Clock}
          color="from-amber-500 to-orange-500"
          trend={-5}
          href="/duas"
        />
        <KPICard
          title="DUAs Procesados"
          value={stats.duasProcesados}
          icon={CheckCircle2}
          color="from-emerald-500 to-teal-500"
          trend={12}
          href="/duas"
        />
        <KPICard
          title="Depósitos Activos"
          value={stats.depositosActivos}
          icon={Warehouse}
          color="from-blue-500 to-indigo-500"
          href="/deposito"
        />
        <KPICard
          title="Unidades en Depósito"
          value={stats.unidadesEnDeposito}
          icon={Package}
          color="from-purple-500 to-pink-500"
          trend={8}
          href="/deposito"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Discrepancias"
          value={stats.discrepancias}
          icon={AlertTriangle}
          color="from-red-500 to-rose-500"
          alert={stats.discrepancias > 0}
          href="/deposito"
        />
        <KPICard
          title="Documentos Pendientes"
          value={stats.documentosPendientes}
          icon={FileText}
          color="from-cyan-500 to-sky-500"
          href="/documentos"
        />
        <KPICard
          title="Stock Total"
          value={stats.stockTotal}
          icon={Package}
          color="from-violet-500 to-purple-500"
          trend={3}
        />
        <KPICard
          title="Movimientos Hoy"
          value={stats.movimientosHoy}
          icon={Zap}
          color="from-yellow-500 to-amber-500"
          trend={15}
        />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Actividad Reciente</CardTitle>
                <Badge variant="neutral">{MOCK_ACTIVITY.length} registros</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {MOCK_ACTIVITY.map((item) => {
                  const badge = activityBadge[item.estado] || { variant: "neutral" as const, label: item.estado };
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-slate-400" />
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/documentos", label: "Subir Documento", icon: FileText, color: "text-cyan-400" },
                { href: "/duas", label: "Nuevo DUA", icon: CheckCircle2, color: "text-emerald-400" },
                { href: "/lame", label: "Nuevo LAME", icon: Package, color: "text-purple-400" },
                { href: "/deposito", label: "Ver Stock", icon: Warehouse, color: "text-blue-400" },
                { href: "/intrastat", label: "Generar Intrastat", icon: TrendingUp, color: "text-amber-400" },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
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
                { label: "API Claude", ok: true },
                { label: "Base de Datos", ok: true },
                { label: "OCR Engine", ok: true },
                { label: "Sync Depósito", ok: !stats.discrepancias },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400 animate-pulse" : "bg-red-400 animate-pulse"}`} />
                    <span className={`text-xs font-medium ${ok ? "text-emerald-400" : "text-red-400"}`}>
                      {ok ? "Activo" : "Error"}
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
