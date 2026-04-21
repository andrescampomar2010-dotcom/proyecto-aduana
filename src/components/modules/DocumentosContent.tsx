"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Eye,
  Sparkles,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Table } from "@/components/ui/Table";
import { DOC_STATUS_COLORS, DOC_STATUS_LABELS, formatDateTime, formatFileSize } from "@/lib/utils";

interface DocumentRecord {
  id: string;
  originalName: string;
  type: string;
  status: string;
  size: number;
  createdAt: string;
  extractedData?: Record<string, unknown>;
  errorMessage?: string;
}

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const DOC_TYPES = [
  { value: "DUA", label: "DUA" },
  { value: "DVD", label: "DVD" },
  { value: "LAME", label: "LAME" },
  { value: "FACTURA", label: "Factura" },
  { value: "CMR", label: "CMR" },
  { value: "PACKING_LIST", label: "Packing List" },
  { value: "INTRASTAT", label: "Intrastat" },
  { value: "OTRO", label: "Otro" },
];

export function DocumentosContent() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState("OTRO");
  const [customPrompt, setCustomPrompt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/documentos");
      const d = await r.json();
      if (d.success) setDocuments(d.data || []);
    } catch {
      // use mock data for demo
      setDocuments(MOCK_DOCS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((f) => ({ file: f, progress: 0, status: "pending" }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "uploading", progress: 30 } : f));

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);
        formData.append("type", docType);
        formData.append("customPrompt", customPrompt);

        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, progress: 60 } : f));
        const r = await fetch("/api/documentos", { method: "POST", body: formData });
        const d = await r.json();

        setFiles((prev) => prev.map((f, idx) =>
          idx === i ? { ...f, status: d.success ? "done" : "error", progress: 100, error: d.error } : f
        ));
      } catch (err) {
        setFiles((prev) => prev.map((f, idx) =>
          idx === i ? { ...f, status: "error", error: "Error de conexión" } : f
        ));
      }
    }

    setUploading(false);
    setAlert({ type: "success", msg: "Documentos subidos y procesados con IA" });
    setTimeout(() => setAlert(null), 4000);
    loadDocuments();
  };

  const columns = [
    {
      key: "originalName",
      header: "Documento",
      render: (doc: DocumentRecord) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate max-w-48">{doc.originalName}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (doc: DocumentRecord) => <Badge variant="info">{doc.type}</Badge>,
    },
    {
      key: "status",
      header: "Estado",
      render: (doc: DocumentRecord) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${DOC_STATUS_COLORS[doc.status] || ""}`}>
          {DOC_STATUS_LABELS[doc.status] || doc.status}
        </span>
      ),
    },
    {
      key: "size",
      header: "Tamaño",
      render: (doc: DocumentRecord) => <span className="text-slate-400">{formatFileSize(doc.size)}</span>,
    },
    {
      key: "createdAt",
      header: "Fecha",
      render: (doc: DocumentRecord) => <span className="text-slate-400">{formatDateTime(doc.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (doc: DocumentRecord) => (
        <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}>
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {alert && (
        <Alert type={alert.type} message={alert.msg} dismissible />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión Documental</h2>
          <p className="text-sm text-slate-400 mt-0.5">Sube documentos y extrae datos automáticamente con IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadDocuments}>
            Actualizar
          </Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowUpload(true)}>
            Subir Documento
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: documents.length, color: "text-white" },
          { label: "Pendientes", value: documents.filter((d) => d.status === "PENDIENTE").length, color: "text-amber-400" },
          { label: "Procesados", value: documents.filter((d) => d.status === "PROCESADO").length, color: "text-emerald-400" },
          { label: "Errores", value: documents.filter((d) => d.status === "ERROR").length, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <Table
          columns={columns}
          data={documents}
          loading={loading}
          keyExtractor={(d) => d.id}
          onRowClick={setSelectedDoc}
          emptyMessage="No hay documentos. Sube el primero."
        />
      </Card>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); setFiles([]); }} title="Subir Documentos" size="lg">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Documento"
              options={DOC_TYPES}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            />
            <Textarea
              label="Instrucciones adicionales para IA (opcional)"
              placeholder="Ej: Prioriza extracción de bastidor y matrícula"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
            />
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/20 hover:border-white/30 hover:bg-white/3"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.tiff,.bmp"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
            />
            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Arrastra archivos aquí o haz clic</p>
              <p className="text-sm text-slate-400 mt-1">PDF, Excel, imágenes — Máx. 20 MB</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              Los datos se extraerán automáticamente con Claude AI
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{f.file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(f.file.size)}</p>
                    {f.status === "uploading" && (
                      <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                      </div>
                    )}
                  </div>
                  {f.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {f.status === "error" && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  {f.status === "uploading" && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />}
                  {f.status === "pending" && (
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowUpload(false); setFiles([]); }}>
              Cancelar
            </Button>
            <Button
              loading={uploading}
              disabled={files.length === 0 || files.every((f) => f.status !== "pending")}
              icon={<Sparkles className="w-4 h-4" />}
              onClick={uploadAll}
            >
              Procesar con IA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Detail Modal */}
      <Modal open={!!selectedDoc} onClose={() => setSelectedDoc(null)} title="Datos Extraídos" size="xl">
        {selectedDoc && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-lg font-semibold text-white">{selectedDoc.originalName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">{selectedDoc.type}</Badge>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${DOC_STATUS_COLORS[selectedDoc.status] || ""}`}>
                    {DOC_STATUS_LABELS[selectedDoc.status] || selectedDoc.status}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(selectedDoc.createdAt)}</span>
                </div>
              </div>
            </div>

            {selectedDoc.status === "ERROR" && selectedDoc.errorMessage && (
              <Alert type="error" title="Error de procesamiento" message={selectedDoc.errorMessage} />
            )}

            {selectedDoc.extractedData && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Datos Extraídos por IA
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedDoc.extractedData).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-slate-500 capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className="text-sm text-white font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedDoc(null)}>
                Cerrar
              </Button>
              <Button
                icon={<FileText className="w-4 h-4" />}
                onClick={() => { /* navigate to create DUA with data */ }}
              >
                Crear DUA desde datos
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const MOCK_DOCS: DocumentRecord[] = [
  { id: "1", originalName: "DUA_2024_0045.pdf", type: "DUA", status: "PROCESADO", size: 245000, createdAt: new Date().toISOString(), extractedData: { referencia: "DUA-2024-0045", cliente: "AUTOESPAÑA SL", unidades: "30", peso: "18500", valor: "890000", matricula: "1234-ABC" } },
  { id: "2", originalName: "Factura_BMW_889.pdf", type: "FACTURA", status: "PROCESADO", size: 180000, createdAt: new Date(Date.now() - 3600000).toISOString(), extractedData: { destinatario: "IMPORTACIONES ES SL", expedidor: "BMW AG", valor: "450000", unidades: "15" } },
  { id: "3", originalName: "LAME_entrada_050.xlsx", type: "LAME", status: "PENDIENTE", size: 45000, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "4", originalName: "CMR_2024_221.jpg", type: "CMR", status: "ERROR", size: 890000, createdAt: new Date(Date.now() - 10800000).toISOString(), errorMessage: "Imagen de baja resolución, no se pudo leer el documento." },
];
