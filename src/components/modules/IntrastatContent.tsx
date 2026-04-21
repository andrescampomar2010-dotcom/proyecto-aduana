"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Globe2, Download, Upload, Sparkles, RefreshCw, Search, Trash2, Edit3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Alert } from "@/components/ui/Alert";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";

interface IntrastatRecord {
  id: string;
  periodo: string;
  paisOrigen?: string;
  paisDestino?: string;
  codigoMercancia?: string;
  descripcion?: string;
  unidades: number;
  peso?: number;
  pesoEstimado?: number;
  valorEstadistico?: number;
  valorFactura?: number;
  moneda: string;
  expedidor?: string;
  destinatario?: string;
  tipoTransaccion?: string;
  modoTransporte?: string;
  exportado: boolean;
  createdAt: string;
}

const MOCK_INTRASTAT: IntrastatRecord[] = [
  { id: "1", periodo: "202401", paisOrigen: "DE", paisDestino: "ES", codigoMercancia: "87032311", descripcion: "Vehículos automóviles cilindrada <1500cc gasoil", unidades: 30, peso: 45000, pesoEstimado: 46000, valorEstadistico: 890000, valorFactura: 850000, moneda: "EUR", expedidor: "BMW AG", destinatario: "AUTOESPAÑA SL", tipoTransaccion: "11", modoTransporte: "3", exportado: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "2", periodo: "202401", paisOrigen: "DE", paisDestino: "ES", codigoMercancia: "87032391", descripcion: "Vehículos automóviles cilindrada >1500cc gasoil", unidades: 15, peso: 22500, pesoEstimado: 23000, valorEstadistico: 450000, valorFactura: 420000, moneda: "EUR", expedidor: "Mercedes-Benz AG", destinatario: "MERCEDES IMPORT SL", tipoTransaccion: "11", modoTransporte: "3", exportado: false, createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: "3", periodo: "202312", paisOrigen: "SE", paisDestino: "ES", codigoMercancia: "87042290", descripcion: "Vehículos para transporte mercancías >5t diesel", unidades: 8, peso: 96000, pesoEstimado: 98000, valorEstadistico: 2100000, valorFactura: 2000000, moneda: "EUR", expedidor: "Volvo AB", destinatario: "VOLVO TRUCKS ES", tipoTransaccion: "11", modoTransporte: "3", exportado: true, createdAt: new Date(Date.now() - 604800000).toISOString() },
];

const PERIODOS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const val = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return { value: val, label: `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` };
});

const TRANSPORT_MODES = [
  { value: "1", label: "1 — Marítimo" },
  { value: "2", label: "2 — Ferroviario" },
  { value: "3", label: "3 — Carretera" },
  { value: "4", label: "4 — Aéreo" },
  { value: "5", label: "5 — Envío postal" },
  { value: "7", label: "7 — Instalaciones fijas" },
];

const TRANSACTION_TYPES = [
  { value: "11", label: "11 — Compraventa definitiva" },
  { value: "12", label: "12 — Entrega con vista a venta o reventa" },
  { value: "21", label: "21 — Devolución" },
  { value: "31", label: "31 — Operaciones en ejecución de un contrato" },
  { value: "41", label: "41 — Transacciones para transformación" },
];

const emptyForm = (): Partial<IntrastatRecord> => ({
  periodo: PERIODOS[0]?.value || "",
  paisOrigen: "",
  paisDestino: "ES",
  codigoMercancia: "",
  descripcion: "",
  unidades: 0,
  peso: undefined,
  pesoEstimado: undefined,
  valorEstadistico: undefined,
  valorFactura: undefined,
  moneda: "EUR",
  expedidor: "",
  destinatario: "",
  tipoTransaccion: "11",
  modoTransporte: "3",
  exportado: false,
});

export function IntrastatContent() {
  const [records, setRecords] = useState<IntrastatRecord[]>(MOCK_INTRASTAT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<IntrastatRecord | null>(null);
  const [form, setForm] = useState<Partial<IntrastatRecord>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/intrastat");
      const d = await r.json();
      if (d.success && d.data?.length) setRecords(d.data);
    } catch { /* use mock */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const filtered = records.filter((r) => {
    const matchSearch = !search ||
      (r.descripcion || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.codigoMercancia || "").includes(search) ||
      (r.expedidor || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.destinatario || "").toLowerCase().includes(search.toLowerCase());
    const matchPeriodo = !filterPeriodo || r.periodo === filterPeriodo;
    return matchSearch && matchPeriodo;
  });

  const openEdit = (rec: IntrastatRecord) => { setForm({ ...rec }); setEditRecord(rec); setShowForm(true); };
  const openNew = () => { setForm(emptyForm()); setEditRecord(null); setShowForm(true); };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const method = editRecord ? "PUT" : "POST";
      const url = editRecord ? `/api/intrastat/${editRecord.id}` : "/api/intrastat";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setShowForm(false); loadRecords(); }
      else throw new Error();
    } catch {
      if (editRecord) {
        setRecords((prev) => prev.map((r) => r.id === editRecord.id ? { ...r, ...form } as IntrastatRecord : r));
      } else {
        const newRec: IntrastatRecord = { ...emptyForm(), ...form, id: String(Date.now()), createdAt: new Date().toISOString() } as IntrastatRecord;
        setRecords((prev) => [newRec, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
      setAlert({ type: "success", msg: editRecord ? "Registro actualizado" : "Registro creado" });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const processOCR = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", ocrFile);
      formData.append("type", "INTRASTAT");
      const r = await fetch("/api/intrastat/ocr", { method: "POST", body: formData });
      const d = await r.json();
      if (d.success && d.data) {
        const newRecs: IntrastatRecord[] = (d.data.facturas || []).map((f: Partial<IntrastatRecord>) => ({
          ...emptyForm(), ...f, id: String(Date.now() + Math.random()), createdAt: new Date().toISOString(),
        }));
        setRecords((prev) => [...newRecs, ...prev]);
        setAlert({ type: "success", msg: `${newRecs.length} registros extraídos automáticamente` });
        setShowOCR(false);
      } else throw new Error(d.error || "Sin datos");
    } catch (e) {
      setAlert({ type: "error", msg: "Error al procesar el documento con IA" });
    } finally {
      setOcrLoading(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const exportCSV = () => {
    const headers = ["Periodo", "País Origen", "País Destino", "Código Mercancía", "Descripción", "Unidades", "Peso", "Valor Estadístico", "Valor Factura", "Expedidor", "Destinatario", "Tipo Transacción", "Modo Transporte"];
    const rows = filtered.map((r) => [r.periodo, r.paisOrigen, r.paisDestino, r.codigoMercancia, r.descripcion, r.unidades, r.peso, r.valorEstadistico, r.valorFactura, r.expedidor, r.destinatario, r.tipoTransaccion, r.modoTransporte].join(";"));
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intrastat_${filterPeriodo || "todos"}.csv`;
    a.click();
  };

  const totals = {
    registros: filtered.length,
    valorTotal: filtered.reduce((a, r) => a + (r.valorEstadistico || 0), 0),
    pesoTotal: filtered.reduce((a, r) => a + (r.peso || 0), 0),
    unidadesTotal: filtered.reduce((a, r) => a + r.unidades, 0),
  };

  const columns = [
    { key: "periodo", header: "Período", render: (r: IntrastatRecord) => <span className="font-mono text-cyan-300">{r.periodo.slice(0, 4)}/{r.periodo.slice(4)}</span> },
    { key: "paises", header: "Origen → Destino", render: (r: IntrastatRecord) => <span className="font-medium">{r.paisOrigen || "?"} → {r.paisDestino || "?"}</span> },
    { key: "codigoMercancia", header: "Cód. Merc.", render: (r: IntrastatRecord) => <span className="font-mono text-sm">{r.codigoMercancia || "—"}</span> },
    { key: "descripcion", header: "Descripción", render: (r: IntrastatRecord) => <span className="text-slate-300 max-w-52 block truncate">{r.descripcion || "—"}</span> },
    { key: "unidades", header: "Uds.", render: (r: IntrastatRecord) => <span>{formatNumber(r.unidades)}</span> },
    { key: "valorEstadistico", header: "V. Estadístico", render: (r: IntrastatRecord) => <span>{formatCurrency(r.valorEstadistico ?? null)}</span> },
    { key: "expedidor", header: "Expedidor", render: (r: IntrastatRecord) => <span className="text-slate-400 text-xs">{r.expedidor || "—"}</span> },
    {
      key: "exportado", header: "Estado",
      render: (r: IntrastatRecord) => <Badge variant={r.exportado ? "success" : "warning"}>{r.exportado ? "Exportado" : "Pendiente"}</Badge>,
    },
    {
      key: "actions", header: "",
      render: (r: IntrastatRecord) => (
        <Button variant="ghost" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}
          onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
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
          <h2 className="text-xl font-semibold text-white">Declaraciones Intrastat</h2>
          <p className="text-sm text-slate-400 mt-0.5">Estadísticas de comercio intracomunitario UE</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadRecords}>Actualizar</Button>
          <Button variant="secondary" size="sm" icon={<Sparkles className="w-4 h-4" />} onClick={() => setShowOCR(true)}>Extraer con IA</Button>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportCSV}>Exportar CSV</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>Nuevo Registro</Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Registros", value: String(totals.registros), icon: Globe2, color: "text-cyan-400" },
          { label: "Valor Estadístico", value: formatCurrency(totals.valorTotal), icon: Globe2, color: "text-emerald-400" },
          { label: "Peso Total (kg)", value: formatNumber(totals.pesoTotal), icon: Globe2, color: "text-blue-400" },
          { label: "Unidades", value: formatNumber(totals.unidadesTotal), icon: Globe2, color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
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
            placeholder="Buscar por descripción, código o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
        <select
          value={filterPeriodo}
          onChange={(e) => setFilterPeriodo(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/40"
        >
          <option value="">Todos los períodos</option>
          {PERIODOS.map((p) => <option key={p.value} value={p.value} className="bg-[#0f1117]">{p.label}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros Intrastat ({filtered.length})</CardTitle>
        </CardHeader>
        <Table columns={columns} data={filtered} loading={loading} keyExtractor={(r) => r.id} onRowClick={openEdit} emptyMessage="Sin registros Intrastat" />
      </Card>

      {/* OCR Modal */}
      <Modal open={showOCR} onClose={() => setShowOCR(false)} title="Extraer Datos Intrastat con IA" size="md">
        <div className="p-6 space-y-5">
          <Alert type="info" message="Sube un PDF con múltiples facturas. Claude AI detectará cada factura y extraerá automáticamente los datos Intrastat." />
          <div
            className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/30 cursor-pointer transition-colors"
            onClick={() => document.getElementById("intrastat-file")?.click()}
          >
            <input id="intrastat-file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => e.target.files?.[0] && setOcrFile(e.target.files[0])} />
            <Upload className="w-8 h-8 text-slate-400" />
            {ocrFile ? (
              <p className="text-sm text-white">{ocrFile.name}</p>
            ) : (
              <p className="text-sm text-slate-400">Clic para seleccionar PDF o imagen con facturas</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowOCR(false)}>Cancelar</Button>
            <Button loading={ocrLoading} disabled={!ocrFile} icon={<Sparkles className="w-4 h-4" />} onClick={processOCR}>
              Procesar con Claude AI
            </Button>
          </div>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editRecord ? "Editar Registro Intrastat" : "Nuevo Registro Intrastat"} size="xl">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Select label="Período" options={PERIODOS} value={form.periodo || ""} onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
            <Input label="País Origen" value={form.paisOrigen || ""} placeholder="DE, FR, IT..." onChange={(e) => setForm({ ...form, paisOrigen: e.target.value })} />
            <Input label="País Destino" value={form.paisDestino || ""} placeholder="ES" onChange={(e) => setForm({ ...form, paisDestino: e.target.value })} />
            <Input label="Código Mercancía (NC8)" value={form.codigoMercancia || ""} placeholder="87032311" onChange={(e) => setForm({ ...form, codigoMercancia: e.target.value })} />
            <Input label="Unidades" type="number" value={form.unidades || 0} onChange={(e) => setForm({ ...form, unidades: Number(e.target.value) })} />
            <Input label="Peso Neto (kg)" type="number" value={form.peso || ""} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} />
            <Input label="Peso Estimado (kg)" type="number" value={form.pesoEstimado || ""} onChange={(e) => setForm({ ...form, pesoEstimado: Number(e.target.value) })} />
            <Input label="Valor Estadístico (€)" type="number" value={form.valorEstadistico || ""} onChange={(e) => setForm({ ...form, valorEstadistico: Number(e.target.value) })} />
            <Input label="Valor Factura (€)" type="number" value={form.valorFactura || ""} onChange={(e) => setForm({ ...form, valorFactura: Number(e.target.value) })} />
            <Input label="Expedidor" value={form.expedidor || ""} onChange={(e) => setForm({ ...form, expedidor: e.target.value })} />
            <Input label="Destinatario" value={form.destinatario || ""} onChange={(e) => setForm({ ...form, destinatario: e.target.value })} />
            <Select label="Tipo Transacción" options={TRANSACTION_TYPES} value={form.tipoTransaccion || "11"} onChange={(e) => setForm({ ...form, tipoTransaccion: e.target.value })} />
            <Select label="Modo Transporte" options={TRANSPORT_MODES} value={form.modoTransporte || "3"} onChange={(e) => setForm({ ...form, modoTransporte: e.target.value })} />
          </div>
          <Textarea label="Descripción de la Mercancía" value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button loading={saving} icon={<Globe2 className="w-4 h-4" />} onClick={saveRecord}>
              {editRecord ? "Actualizar" : "Crear Registro"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
