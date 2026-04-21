"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Package, ArrowDown, ArrowUp, RefreshCw, Search, Edit3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Alert } from "@/components/ui/Alert";
import { MOVEMENT_LABELS, formatDate, generateId } from "@/lib/utils";

interface LAMERecord {
  id: string;
  numeroLAME: string;
  tipo: string;
  referencia?: string;
  producto: string;
  descripcion?: string;
  unidades: number;
  peso?: number;
  ubicacion?: string;
  instrucciones?: string;
  fecha: string;
  createdAt: string;
}

const TIPO_OPTIONS = [
  { value: "ENTRADA", label: "Entrada en Depósito" },
  { value: "SALIDA", label: "Salida de Depósito" },
  { value: "AJUSTE", label: "Ajuste de Inventario" },
  { value: "RESERVA", label: "Reserva" },
];

const MOCK_LAMES: LAMERecord[] = [
  { id: "1", numeroLAME: "LAME-001", tipo: "ENTRADA", referencia: "DUA-2024-0044", producto: "BMW X5", descripcion: "Vehículos BMW X5 xDrive30d", unidades: 50, peso: 35000, ubicacion: "Nave A — Zona 1", fecha: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: "2", numeroLAME: "LAME-002", tipo: "SALIDA", referencia: "DUA-2024-0045", producto: "BMW X5", descripcion: "Despacho parcial BMW X5", unidades: 20, peso: 14000, ubicacion: "Nave A — Zona 1", instrucciones: "Verificar bastidores antes de salida", fecha: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", numeroLAME: "LAME-003", tipo: "ENTRADA", referencia: "REF-MERC-889", producto: "Mercedes Clase C", descripcion: "Mercedes-Benz Clase C 200 CDI", unidades: 15, peso: 10500, ubicacion: "Nave B — Zona 2", fecha: new Date(Date.now() - 43200000).toISOString(), createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: "4", numeroLAME: "LAME-004", tipo: "AJUSTE", referencia: "INV-2024-10", producto: "Repuestos Audi", descripcion: "Ajuste inventario tras verificación", unidades: -5, ubicacion: "Almacén Central", instrucciones: "Unidades dañadas durante transporte", fecha: new Date().toISOString(), createdAt: new Date().toISOString() },
];

const emptyForm = (): Partial<LAMERecord> => ({
  numeroLAME: generateId("LAME"),
  tipo: "ENTRADA",
  producto: "",
  descripcion: "",
  unidades: 0,
  peso: undefined,
  ubicacion: "",
  instrucciones: "",
  referencia: "",
  fecha: new Date().toISOString().split("T")[0],
});

export function LAMEContent() {
  const [lames, setLames] = useState<LAMERecord[]>(MOCK_LAMES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editLAME, setEditLAME] = useState<LAMERecord | null>(null);
  const [form, setForm] = useState<Partial<LAMERecord>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadLAMEs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/lame");
      const d = await r.json();
      if (d.success && d.data?.length) setLames(d.data);
    } catch { /* use mock */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLAMEs(); }, [loadLAMEs]);

  const filtered = lames.filter((l) => {
    const matchSearch = !search ||
      l.numeroLAME.toLowerCase().includes(search.toLowerCase()) ||
      l.producto.toLowerCase().includes(search.toLowerCase()) ||
      (l.referencia || "").toLowerCase().includes(search.toLowerCase());
    const matchTipo = !filterTipo || l.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const openNew = () => { setForm(emptyForm()); setEditLAME(null); setShowForm(true); };
  const openEdit = (lame: LAMERecord) => { setForm({ ...lame, fecha: lame.fecha.split("T")[0] }); setEditLAME(lame); setShowForm(true); };

  const saveLAME = async () => {
    setSaving(true);
    try {
      const method = editLAME ? "PUT" : "POST";
      const url = editLAME ? `/api/lame/${editLAME.id}` : "/api/lame";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) {
        setShowForm(false);
        loadLAMEs();
      } else throw new Error(d.error);
    } catch {
      if (editLAME) {
        setLames((prev) => prev.map((l) => l.id === editLAME.id ? { ...l, ...form } as LAMERecord : l));
      } else {
        const newLAME: LAMERecord = { ...emptyForm(), ...form, id: String(Date.now()), createdAt: new Date().toISOString() } as LAMERecord;
        setLames((prev) => [newLAME, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
      setAlert({ type: "success", msg: editLAME ? "LAME actualizado" : "LAME creado correctamente" });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const tipoIcon = (tipo: string) => {
    if (tipo === "ENTRADA") return <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />;
    if (tipo === "SALIDA") return <ArrowUp className="w-3.5 h-3.5 text-red-400" />;
    return <Package className="w-3.5 h-3.5 text-amber-400" />;
  };

  const tipoBadge = (tipo: string) => {
    const variants: Record<string, "success" | "error" | "warning" | "info"> = {
      ENTRADA: "success", SALIDA: "error", AJUSTE: "warning", RESERVA: "info",
    };
    return <Badge variant={variants[tipo] || "neutral"}>{MOVEMENT_LABELS[tipo] || tipo}</Badge>;
  };

  const totals = {
    entradas: lames.filter((l) => l.tipo === "ENTRADA").reduce((a, l) => a + l.unidades, 0),
    salidas: lames.filter((l) => l.tipo === "SALIDA").reduce((a, l) => a + Math.abs(l.unidades), 0),
    ajustes: lames.filter((l) => l.tipo === "AJUSTE").length,
  };

  const columns = [
    { key: "numeroLAME", header: "Nº LAME", render: (l: LAMERecord) => <span className="font-mono text-cyan-300 font-medium">{l.numeroLAME}</span> },
    { key: "tipo", header: "Tipo", render: (l: LAMERecord) => <div className="flex items-center gap-1.5">{tipoIcon(l.tipo)}{tipoBadge(l.tipo)}</div> },
    { key: "referencia", header: "Referencia", render: (l: LAMERecord) => <span className="text-slate-400">{l.referencia || "—"}</span> },
    { key: "producto", header: "Producto", render: (l: LAMERecord) => <span className="font-medium max-w-40 block truncate">{l.producto}</span> },
    {
      key: "unidades", header: "Unidades",
      render: (l: LAMERecord) => (
        <span className={`font-bold ${l.unidades > 0 ? "text-emerald-400" : "text-red-400"}`}>
          {l.unidades > 0 ? "+" : ""}{l.unidades}
        </span>
      ),
    },
    { key: "ubicacion", header: "Ubicación", render: (l: LAMERecord) => <span className="text-slate-400 text-xs">{l.ubicacion || "—"}</span> },
    { key: "fecha", header: "Fecha", render: (l: LAMERecord) => <span className="text-slate-400">{formatDate(l.fecha)}</span> },
    {
      key: "actions", header: "",
      render: (l: LAMERecord) => (
        <Button variant="ghost" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}
          onClick={(e) => { e.stopPropagation(); openEdit(l); }}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.msg} dismissible />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">LAME / DVD</h2>
          <p className="text-sm text-slate-400 mt-0.5">Listados de Autorización de Movimientos en depósito</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadLAMEs}>Actualizar</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>Nuevo Movimiento</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <ArrowDown className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">+{totals.entradas}</p>
              <p className="text-xs text-slate-400 mt-0.5">Unidades Entradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/20">
              <ArrowUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">-{totals.salidas}</p>
              <p className="text-xs text-slate-400 mt-0.5">Unidades Salidas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/20">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{totals.entradas - totals.salidas}</p>
              <p className="text-xs text-slate-400 mt-0.5">Stock Neto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por LAME, producto o referencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
        <div className="flex gap-2">
          {TIPO_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFilterTipo(filterTipo === o.value ? "" : o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filterTipo === o.value ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {o.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos ({filtered.length})</CardTitle>
        </CardHeader>
        <Table columns={columns} data={filtered} loading={loading} keyExtractor={(l) => l.id} onRowClick={openEdit} emptyMessage="Sin movimientos registrados" />
      </Card>

      {/* LAME Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editLAME ? `Editar ${editLAME.numeroLAME}` : "Nuevo Movimiento LAME"} size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Número LAME" value={form.numeroLAME || ""} onChange={(e) => setForm({ ...form, numeroLAME: e.target.value })} />
            <Select label="Tipo de Movimiento" options={TIPO_OPTIONS} value={form.tipo || "ENTRADA"} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
            <Input label="Referencia Documental" value={form.referencia || ""} placeholder="DUA-XXXX, REF-XXXX..." onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
            <Input label="Fecha" type="date" value={form.fecha || ""} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            <Input label="Producto" value={form.producto || ""} onChange={(e) => setForm({ ...form, producto: e.target.value })} />
            <Input label="Unidades" type="number" value={form.unidades || 0} onChange={(e) => setForm({ ...form, unidades: Number(e.target.value) })} />
            <Input label="Peso (kg)" type="number" value={form.peso || ""} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} />
            <Input label="Ubicación" value={form.ubicacion || ""} placeholder="Nave A, Zona 1..." onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          </div>
          <Textarea label="Descripción" value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
          <Textarea label="Instrucciones de Despacho" value={form.instrucciones || ""} onChange={(e) => setForm({ ...form, instrucciones: e.target.value })} rows={2} placeholder="Instrucciones específicas para este movimiento..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button loading={saving} icon={<Package className="w-4 h-4" />} onClick={saveLAME}>
              {editLAME ? "Actualizar" : "Registrar Movimiento"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
