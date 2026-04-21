"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Warehouse, AlertTriangle, CheckCircle2, RefreshCw, Search, Zap, ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Alert } from "@/components/ui/Alert";
import { formatDate, formatNumber, generateId } from "@/lib/utils";

interface StockItem {
  id: string;
  referencia: string;
  descripcion: string;
  producto: string;
  unidadesTotal: number;
  unidadesDisponibles: number;
  unidadesReservadas: number;
  unidadesDespachadas: number;
  ubicacion?: string;
  lote?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CrossCheckForm {
  referencia: string;
  unidadesADescontar: number;
  motivo: string;
  instrucciones: string;
}

const MOCK_STOCK: StockItem[] = [
  { id: "1", referencia: "BMW-X5-2024", descripcion: "BMW X5 xDrive30d — Lote 2024/A", producto: "BMW X5", unidadesTotal: 50, unidadesDisponibles: 30, unidadesReservadas: 5, unidadesDespachadas: 15, ubicacion: "Nave A — Zona 1", lote: "2024/A", activo: true, createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", referencia: "MERC-C200-2024", descripcion: "Mercedes Clase C 200 CDI — Lote 2024/B", producto: "Mercedes Clase C", unidadesTotal: 25, unidadesDisponibles: 25, unidadesReservadas: 0, unidadesDespachadas: 0, ubicacion: "Nave B — Zona 2", lote: "2024/B", activo: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", referencia: "AUDI-REPUESTOS-01", descripcion: "Repuestos Audi A4/A6 surtidos", producto: "Repuestos Audi", unidadesTotal: 500, unidadesDisponibles: 0, unidadesReservadas: 0, unidadesDespachadas: 500, ubicacion: "Almacén Central", activo: false, createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: "4", referencia: "VOLVO-FH-001", descripcion: "Camiones Volvo FH 500 — Lote 2024/C", producto: "Volvo FH", unidadesTotal: 8, unidadesDisponibles: 2, unidadesReservadas: 6, unidadesDespachadas: 0, ubicacion: "Zona Exterior — Patio B", lote: "2024/C", activo: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const emptyStock = (): Partial<StockItem> => ({
  referencia: generateId("REF"),
  descripcion: "",
  producto: "",
  unidadesTotal: 0,
  unidadesDisponibles: 0,
  unidadesReservadas: 0,
  unidadesDespachadas: 0,
  ubicacion: "",
  lote: "",
  activo: true,
});

export function DepositoContent() {
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActivo, setFilterActivo] = useState<"" | "true" | "false">("");
  const [showForm, setShowForm] = useState(false);
  const [showCrossCheck, setShowCrossCheck] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [form, setForm] = useState<Partial<StockItem>>(emptyStock());
  const [crossForm, setCrossForm] = useState<CrossCheckForm>({ referencia: "", unidadesADescontar: 0, motivo: "", instrucciones: "" });
  const [saving, setSaving] = useState(false);
  const [crossing, setCrossing] = useState(false);
  const [crossResult, setCrossResult] = useState<{ success: boolean; message: string; discrepancia?: boolean } | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; msg: string } | null>(null);

  const loadStock = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/deposito");
      const d = await r.json();
      if (d.success && d.data?.length) setStock(d.data);
    } catch { /* use mock */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStock(); }, [loadStock]);

  const filtered = stock.filter((s) => {
    const matchSearch = !search ||
      s.referencia.toLowerCase().includes(search.toLowerCase()) ||
      s.producto.toLowerCase().includes(search.toLowerCase()) ||
      (s.ubicacion || "").toLowerCase().includes(search.toLowerCase());
    const matchActivo = !filterActivo || String(s.activo) === filterActivo;
    return matchSearch && matchActivo;
  });

  const totals = {
    total: stock.reduce((a, s) => a + s.unidadesTotal, 0),
    disponibles: stock.reduce((a, s) => a + s.unidadesDisponibles, 0),
    reservadas: stock.reduce((a, s) => a + s.unidadesReservadas, 0),
    despachadas: stock.reduce((a, s) => a + s.unidadesDespachadas, 0),
    alertas: stock.filter((s) => s.unidadesDisponibles === 0 && s.activo).length,
  };

  const executeDespacho = async () => {
    const target = stock.find((s) => s.referencia === crossForm.referencia || s.id === selectedStock?.id);
    if (!target) { setAlert({ type: "error", msg: "Referencia no encontrada en depósito" }); return; }
    if (crossForm.unidadesADescontar > target.unidadesDisponibles) {
      setCrossResult({ success: false, message: `Discrepancia: Se solicitan ${crossForm.unidadesADescontar} unidades pero solo hay ${target.unidadesDisponibles} disponibles.`, discrepancia: true });
      return;
    }
    setCrossing(true);
    try {
      const r = await fetch(`/api/deposito/${target.id}/despacho`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crossForm),
      });
      const d = await r.json();
      if (d.success) {
        setCrossResult({ success: true, message: `Despacho ejecutado. Stock actualizado: ${target.unidadesDisponibles - crossForm.unidadesADescontar} unidades disponibles.` });
        setStock((prev) => prev.map((s) => s.id === target.id ? {
          ...s,
          unidadesDisponibles: s.unidadesDisponibles - crossForm.unidadesADescontar,
          unidadesDespachadas: s.unidadesDespachadas + crossForm.unidadesADescontar,
        } : s));
      } else throw new Error(d.error);
    } catch {
      // Demo mode
      const newDisp = target.unidadesDisponibles - crossForm.unidadesADescontar;
      setStock((prev) => prev.map((s) => s.id === target.id ? {
        ...s,
        unidadesDisponibles: newDisp,
        unidadesDespachadas: s.unidadesDespachadas + crossForm.unidadesADescontar,
      } : s));
      setCrossResult({ success: true, message: `Despacho ejecutado. Stock actualizado: ${newDisp} unidades disponibles.` });
    } finally {
      setCrossing(false);
    }
  };

  const openCrossCheck = (item: StockItem) => {
    setSelectedStock(item);
    setCrossForm({ referencia: item.referencia, unidadesADescontar: 0, motivo: "", instrucciones: "" });
    setCrossResult(null);
    setShowCrossCheck(true);
  };

  const saveStock = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/deposito", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setShowForm(false); loadStock(); }
      else throw new Error();
    } catch {
      const newItem: StockItem = { ...emptyStock(), ...form, id: String(Date.now()), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unidadesDisponibles: Number(form.unidadesTotal) } as StockItem;
      setStock((prev) => [newItem, ...prev]);
      setShowForm(false);
    } finally {
      setSaving(false);
      setAlert({ type: "success", msg: "Stock registrado correctamente" });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const getStockStatus = (item: StockItem) => {
    if (!item.activo) return { color: "text-slate-500", label: "Inactivo" };
    if (item.unidadesDisponibles === 0) return { color: "text-red-400", label: "Agotado" };
    if (item.unidadesDisponibles < item.unidadesTotal * 0.2) return { color: "text-amber-400", label: "Bajo" };
    return { color: "text-emerald-400", label: "Disponible" };
  };

  const columns = [
    { key: "referencia", header: "Referencia", render: (s: StockItem) => <span className="font-mono text-cyan-300 font-medium">{s.referencia}</span> },
    { key: "producto", header: "Producto", render: (s: StockItem) => <div><p className="font-medium">{s.producto}</p><p className="text-xs text-slate-500 truncate max-w-36">{s.descripcion}</p></div> },
    { key: "ubicacion", header: "Ubicación", render: (s: StockItem) => <span className="text-xs text-slate-400">{s.ubicacion || "—"}</span> },
    {
      key: "stock", header: "Stock",
      render: (s: StockItem) => {
        const pct = s.unidadesTotal > 0 ? (s.unidadesDisponibles / s.unidadesTotal) * 100 : 0;
        return (
          <div className="min-w-32">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={getStockStatus(s).color}>{formatNumber(s.unidadesDisponibles)}/{formatNumber(s.unidadesTotal)}</span>
              <span className={getStockStatus(s).color}>{getStockStatus(s).label}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct > 20 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    { key: "unidadesReservadas", header: "Reservadas", render: (s: StockItem) => <span className="text-amber-400">{formatNumber(s.unidadesReservadas)}</span> },
    { key: "unidadesDespachadas", header: "Despachadas", render: (s: StockItem) => <span className="text-slate-400">{formatNumber(s.unidadesDespachadas)}</span> },
    {
      key: "actions", header: "",
      render: (s: StockItem) => (
        <Button variant="outline" size="sm" icon={<Zap className="w-3.5 h-3.5" />}
          disabled={!s.activo || s.unidadesDisponibles === 0}
          onClick={(e) => { e.stopPropagation(); openCrossCheck(s); }}>
          Despachar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.msg} dismissible />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Control de Depósito Aduanero</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gestión automática de stock y cruce documental</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadStock}>Actualizar</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setForm(emptyStock()); setShowForm(true); }}>Añadir Stock</Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total Unidades", value: totals.total, color: "text-white", icon: Warehouse },
          { label: "Disponibles", value: totals.disponibles, color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Reservadas", value: totals.reservadas, color: "text-amber-400", icon: ArrowDown },
          { label: "Despachadas", value: totals.despachadas, color: "text-slate-400", icon: ArrowUp },
          { label: "Alertas Stock", value: totals.alertas, color: "text-red-400", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className={value > 0 && label === "Alertas Stock" ? "border-red-500/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{formatNumber(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por referencia, producto o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
        {[{ v: "", l: "Todos" }, { v: "true", l: "Activos" }, { v: "false", l: "Inactivos" }].map(({ v, l }) => (
          <button key={v} onClick={() => setFilterActivo(v as "" | "true" | "false")}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${filterActivo === v ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventario en Depósito ({filtered.length} referencias)</CardTitle>
            {totals.alertas > 0 && (
              <Badge variant="error">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totals.alertas} alerta{totals.alertas > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <Table columns={columns} data={filtered} loading={loading} keyExtractor={(s) => s.id} emptyMessage="Sin referencias en depósito" />
      </Card>

      {/* New Stock Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Añadir Stock al Depósito" size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Referencia" value={form.referencia || ""} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
            <Input label="Producto" value={form.producto || ""} onChange={(e) => setForm({ ...form, producto: e.target.value })} />
            <Input label="Descripción" value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <Input label="Lote" value={form.lote || ""} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
            <Input label="Unidades Totales" type="number" value={form.unidadesTotal || 0} onChange={(e) => setForm({ ...form, unidadesTotal: Number(e.target.value), unidadesDisponibles: Number(e.target.value) })} />
            <Input label="Ubicación" value={form.ubicacion || ""} placeholder="Nave A, Zona 1..." onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button loading={saving} icon={<Warehouse className="w-4 h-4" />} onClick={saveStock}>Registrar Stock</Button>
          </div>
        </div>
      </Modal>

      {/* Cross-Check / Despacho Modal */}
      <Modal open={showCrossCheck} onClose={() => { setShowCrossCheck(false); setCrossResult(null); }} title="Motor de Cruce — Ejecutar Despacho" size="lg">
        {selectedStock && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-semibold text-blue-300 mb-2">{selectedStock.producto}</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xl font-bold text-emerald-400">{selectedStock.unidadesDisponibles}</p><p className="text-xs text-slate-400">Disponibles</p></div>
                <div><p className="text-xl font-bold text-amber-400">{selectedStock.unidadesReservadas}</p><p className="text-xs text-slate-400">Reservadas</p></div>
                <div><p className="text-xl font-bold text-slate-400">{selectedStock.unidadesDespachadas}</p><p className="text-xs text-slate-400">Despachadas</p></div>
              </div>
            </div>

            {!crossResult && (
              <div className="space-y-4">
                <Input
                  label="Unidades a Despachar"
                  type="number"
                  value={crossForm.unidadesADescontar}
                  onChange={(e) => setCrossForm({ ...crossForm, unidadesADescontar: Number(e.target.value) })}
                  hint={`Máximo disponible: ${selectedStock.unidadesDisponibles}`}
                />
                <Input label="Referencia DUA / Motivo" value={crossForm.motivo} onChange={(e) => setCrossForm({ ...crossForm, motivo: e.target.value })} placeholder="DUA-2024-XXXX" />
                <Textarea label="Instrucciones" value={crossForm.instrucciones} onChange={(e) => setCrossForm({ ...crossForm, instrucciones: e.target.value })} rows={2} />
                {crossForm.unidadesADescontar > selectedStock.unidadesDisponibles && (
                  <Alert type="warning" title="Discrepancia detectada" message={`Se solicitan ${crossForm.unidadesADescontar} unidades pero solo hay ${selectedStock.unidadesDisponibles} disponibles. El sistema marcará alerta.`} />
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowCrossCheck(false)}>Cancelar</Button>
                  <Button loading={crossing} icon={<Zap className="w-4 h-4" />} onClick={executeDespacho}>
                    Ejecutar Cruce Automático
                  </Button>
                </div>
              </div>
            )}

            {crossResult && (
              <div className="space-y-4">
                <Alert
                  type={crossResult.success ? "success" : "error"}
                  title={crossResult.success ? "Despacho ejecutado" : "Discrepancia detectada"}
                  message={crossResult.message}
                />
                <Button onClick={() => { setShowCrossCheck(false); setCrossResult(null); }}>Cerrar</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
