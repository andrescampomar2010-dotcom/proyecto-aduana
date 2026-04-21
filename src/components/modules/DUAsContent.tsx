"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Edit3, CheckCircle2, X, RefreshCw, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Alert } from "@/components/ui/Alert";
import { DUA_STATUS_COLORS, DUA_STATUS_LABELS, formatDate, formatCurrency } from "@/lib/utils";
import { generateId } from "@/lib/utils";

interface DUARecord {
  id: string;
  numeroDUA: string;
  cliente: string;
  mercancia: string;
  unidades: number;
  valor?: number;
  moneda: string;
  regimen?: string;
  status: string;
  instrucciones?: string;
  paisOrigen?: string;
  paisDestino?: string;
  matricula?: string;
  bastidor?: string;
  createdAt: string;
  fechaDespacho?: string;
}

const STATUS_OPTIONS = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_TRAMITE", label: "En Trámite" },
  { value: "DESPACHADO", label: "Despachado" },
  { value: "RECHAZADO", label: "Rechazado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const REGIMEN_OPTIONS = [
  { value: "", label: "Seleccionar régimen..." },
  { value: "4000", label: "4000 — Despacho libre práctica" },
  { value: "3171", label: "3171 — Exportación definitiva" },
  { value: "5100", label: "5100 — Depósito aduanero" },
  { value: "6100", label: "6100 — Perfeccionamiento activo" },
  { value: "7100", label: "7100 — Importación temporal" },
];

const MOCK_DUAS: DUARecord[] = [
  { id: "1", numeroDUA: "DUA-2024-0045", cliente: "AUTOESPAÑA SL", mercancia: "Vehículos BMW Serie 3", unidades: 30, valor: 890000, moneda: "EUR", regimen: "4000", status: "DESPACHADO", paisOrigen: "DE", paisDestino: "ES", createdAt: new Date(Date.now() - 86400000).toISOString(), fechaDespacho: new Date().toISOString() },
  { id: "2", numeroDUA: "DUA-2024-0046", cliente: "MERCEDES IMPORT SL", mercancia: "Vehículos Mercedes Clase C", unidades: 15, valor: 450000, moneda: "EUR", regimen: "4000", status: "EN_TRAMITE", paisOrigen: "DE", paisDestino: "ES", createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: "3", numeroDUA: "DUA-2024-0047", cliente: "AUDI ESPAÑA SA", mercancia: "Repuestos Audi A4", unidades: 500, valor: 125000, moneda: "EUR", regimen: "5100", status: "PENDIENTE", paisOrigen: "DE", paisDestino: "ES", createdAt: new Date().toISOString() },
  { id: "4", numeroDUA: "DUA-2024-0048", cliente: "VOLVO TRUCKS ES", mercancia: "Camiones Volvo FH", unidades: 8, valor: 2100000, moneda: "EUR", regimen: "4000", status: "BORRADOR", paisOrigen: "SE", paisDestino: "ES", createdAt: new Date().toISOString() },
];

const emptyForm = (): Partial<DUARecord> => ({
  numeroDUA: generateId("DUA"),
  cliente: "",
  mercancia: "",
  unidades: 0,
  valor: undefined,
  moneda: "EUR",
  regimen: "",
  status: "BORRADOR",
  instrucciones: "",
  paisOrigen: "",
  paisDestino: "",
  matricula: "",
  bastidor: "",
});

export function DUAsContent() {
  const [duas, setDuas] = useState<DUARecord[]>(MOCK_DUAS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDUA, setEditDUA] = useState<DUARecord | null>(null);
  const [form, setForm] = useState<Partial<DUARecord>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadDUAs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/duas");
      const d = await r.json();
      if (d.success && d.data?.length) setDuas(d.data);
    } catch { /* use mock */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDUAs(); }, [loadDUAs]);

  const filtered = duas.filter((d) => {
    const matchSearch = !search || d.numeroDUA.toLowerCase().includes(search.toLowerCase()) ||
      d.cliente.toLowerCase().includes(search.toLowerCase()) ||
      d.mercancia.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm(emptyForm()); setEditDUA(null); setShowForm(true); };
  const openEdit = (dua: DUARecord) => { setForm({ ...dua }); setEditDUA(dua); setShowForm(true); };

  const saveDUA = async () => {
    setSaving(true);
    try {
      const method = editDUA ? "PUT" : "POST";
      const url = editDUA ? `/api/duas/${editDUA.id}` : "/api/duas";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) {
        setAlert({ type: "success", msg: editDUA ? "DUA actualizado" : "DUA creado correctamente" });
        setShowForm(false);
        loadDUAs();
      } else throw new Error(d.error);
    } catch {
      // Demo: update local state
      if (editDUA) {
        setDuas((prev) => prev.map((d) => d.id === editDUA.id ? { ...d, ...form } as DUARecord : d));
      } else {
        const newDUA: DUARecord = { ...emptyForm(), ...form, id: String(Date.now()), createdAt: new Date().toISOString() } as DUARecord;
        setDuas((prev) => [newDUA, ...prev]);
      }
      setAlert({ type: "success", msg: editDUA ? "DUA actualizado" : "DUA creado correctamente" });
      setShowForm(false);
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const updateStatus = (dua: DUARecord, status: string) => {
    setDuas((prev) => prev.map((d) => d.id === dua.id ? { ...d, status } : d));
  };

  const columns = [
    { key: "numeroDUA", header: "Número DUA", render: (d: DUARecord) => <span className="font-mono font-medium text-cyan-300">{d.numeroDUA}</span> },
    { key: "cliente", header: "Cliente", render: (d: DUARecord) => <span className="font-medium">{d.cliente}</span> },
    { key: "mercancia", header: "Mercancía", render: (d: DUARecord) => <span className="text-slate-300 truncate max-w-40 block">{d.mercancia}</span> },
    { key: "unidades", header: "Uds.", render: (d: DUARecord) => <span className="font-medium">{d.unidades}</span> },
    { key: "valor", header: "Valor", render: (d: DUARecord) => <span className="text-slate-300">{formatCurrency(d.valor ?? null, d.moneda)}</span> },
    {
      key: "status", header: "Estado",
      render: (d: DUARecord) => (
        <select
          value={d.status}
          onChange={(e) => { e.stopPropagation(); updateStatus(d, e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent cursor-pointer ${DUA_STATUS_COLORS[d.status] || ""}`}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#0f1117] text-white">{o.label}</option>)}
        </select>
      ),
    },
    { key: "createdAt", header: "Fecha", render: (d: DUARecord) => <span className="text-slate-400">{formatDate(d.createdAt)}</span> },
    {
      key: "actions", header: "",
      render: (d: DUARecord) => (
        <Button variant="ghost" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}
          onClick={(e) => { e.stopPropagation(); openEdit(d); }}>
          Editar
        </Button>
      ),
    },
  ];

  const statusCounts = STATUS_OPTIONS.reduce((acc, o) => ({
    ...acc, [o.value]: duas.filter((d) => d.status === o.value).length
  }), {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.msg} dismissible />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión de DUAs</h2>
          <p className="text-sm text-slate-400 mt-0.5">Documentos Únicos Administrativos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadDUAs}>Actualizar</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>Nuevo DUA</Button>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilterStatus(filterStatus === o.value ? "" : o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterStatus === o.value
                ? DUA_STATUS_COLORS[o.value]
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {o.label} <span className="ml-1.5 opacity-70">({statusCounts[o.value] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por número, cliente o mercancía..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>DUAs ({filtered.length})</CardTitle>
          </div>
        </CardHeader>
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          keyExtractor={(d) => d.id}
          onRowClick={openEdit}
          emptyMessage="No hay DUAs con los filtros aplicados"
        />
      </Card>

      {/* DUA Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editDUA ? `Editar DUA — ${editDUA.numeroDUA}` : "Nuevo DUA"} size="xl">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Número DUA" value={form.numeroDUA || ""} onChange={(e) => setForm({ ...form, numeroDUA: e.target.value })} />
            <Select label="Estado" options={STATUS_OPTIONS} value={form.status || "BORRADOR"} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            <Input label="Cliente" value={form.cliente || ""} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
            <Input label="Mercancía" value={form.mercancia || ""} onChange={(e) => setForm({ ...form, mercancia: e.target.value })} />
            <Input label="Unidades" type="number" value={form.unidades || 0} onChange={(e) => setForm({ ...form, unidades: Number(e.target.value) })} />
            <Input label="Valor" type="number" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
            <Select label="Régimen" options={REGIMEN_OPTIONS} value={form.regimen || ""} onChange={(e) => setForm({ ...form, regimen: e.target.value })} />
            <Input label="Moneda" value={form.moneda || "EUR"} onChange={(e) => setForm({ ...form, moneda: e.target.value })} />
            <Input label="País Origen" value={form.paisOrigen || ""} onChange={(e) => setForm({ ...form, paisOrigen: e.target.value })} placeholder="ES, DE, FR..." />
            <Input label="País Destino" value={form.paisDestino || ""} onChange={(e) => setForm({ ...form, paisDestino: e.target.value })} placeholder="ES, DE, FR..." />
            <Input label="Matrícula" value={form.matricula || ""} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
            <Input label="Bastidor / VIN" value={form.bastidor || ""} onChange={(e) => setForm({ ...form, bastidor: e.target.value })} />
          </div>
          <Textarea
            label="Instrucciones de Despacho"
            value={form.instrucciones || ""}
            onChange={(e) => setForm({ ...form, instrucciones: e.target.value })}
            rows={3}
            placeholder="Instrucciones específicas para el procesamiento del despacho..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button loading={saving} icon={<CheckCircle2 className="w-4 h-4" />} onClick={saveDUA}>
              {editDUA ? "Actualizar DUA" : "Crear DUA"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
