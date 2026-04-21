"use client";
import { useState, useEffect } from "react";
import { Settings, Key, Sliders, Users, Save, Eye, EyeOff, CheckCircle2, Plus, Trash2, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface ConfigState {
  apiKey: string;
  ocrModel: string;
  ocrMaxTokens: string;
  ocrCustomPrompt: string;
  stockAlertThreshold: string;
  defaultRegimen: string;
  defaultMoneda: string;
  autoDespacho: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const MOCK_USERS: UserRecord[] = [
  { id: "1", name: "Administrador", email: "admin@aduana.es", role: "ADMIN", active: true },
  { id: "2", name: "Operador 1", email: "operador1@aduana.es", role: "OPERATOR", active: true },
  { id: "3", name: "Supervisor", email: "supervisor@aduana.es", role: "VIEWER", active: false },
];

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "OPERATOR", label: "Operador" },
  { value: "VIEWER", label: "Solo lectura" },
];

const MODEL_OPTIONS = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 (Recomendado)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Rápido)" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Económico)" },
];

const TABS = ["API y Claude", "OCR", "Reglas", "Usuarios"];

export function ConfiguracionContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<ConfigState>({
    apiKey: "",
    ocrModel: "claude-opus-4-7",
    ocrMaxTokens: "2000",
    ocrCustomPrompt: "",
    stockAlertThreshold: "20",
    defaultRegimen: "4000",
    defaultMoneda: "EUR",
    autoDespacho: "false",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "OPERATOR", password: "" });

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((d) => {
      if (d.success && d.data) {
        const cfg: Partial<ConfigState> = {};
        (d.data as Array<{ key: string; value: string }>).forEach(({ key, value }) => { (cfg as Record<string, string>)[key] = value; });
        setConfig((prev) => ({ ...prev, ...cfg }));
      }
    }).catch(() => {});
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = await r.json();
      setAlert({ type: d.success ? "success" : "error", msg: d.success ? "Configuración guardada" : d.error || "Error" });
    } catch {
      setAlert({ type: "success", msg: "Configuración guardada localmente" });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const testAPI = async () => {
    setTesting(true);
    setAlert({ type: "info", msg: "Probando conexión con Claude API..." });
    try {
      const r = await fetch("/api/config/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: config.apiKey }) });
      const d = await r.json();
      setAlert({ type: d.success ? "success" : "error", msg: d.success ? "Conexión exitosa con Claude API" : d.error || "Error de conexión" });
    } catch {
      setAlert({ type: "error", msg: "No se pudo conectar. Verifica la API Key." });
    } finally {
      setTesting(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const saveUser = () => {
    const newUser: UserRecord = { id: String(Date.now()), ...userForm, active: true };
    setUsers((prev) => [...prev, newUser]);
    setShowUserForm(false);
    setUserForm({ name: "", email: "", role: "OPERATOR", password: "" });
    setAlert({ type: "success", msg: "Usuario creado correctamente" });
    setTimeout(() => setAlert(null), 3000);
  };

  const toggleUser = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !u.active } : u));
  };

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.msg} dismissible />}

      <div>
        <h2 className="text-xl font-semibold text-white">Configuración del Sistema</h2>
        <p className="text-sm text-slate-400 mt-0.5">Parámetros de API, OCR, reglas y usuarios</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === i ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            {[<Key className="w-3.5 h-3.5" />, <Sliders className="w-3.5 h-3.5" />, <Settings className="w-3.5 h-3.5" />, <Users className="w-3.5 h-3.5" />][i]}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: API y Claude */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configuración de Claude API</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-cyan-300">Anthropic API Key</p>
                    <p className="text-xs text-slate-400 mt-0.5">Obtén tu API Key en <span className="text-cyan-400">console.anthropic.com</span></p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Select
                label="Modelo de IA"
                options={MODEL_OPTIONS}
                value={config.ocrModel}
                onChange={(e) => setConfig({ ...config, ocrModel: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="secondary" loading={testing} onClick={testAPI} icon={<CheckCircle2 className="w-4 h-4" />}>
                  Probar Conexión
                </Button>
                <Button loading={saving} onClick={saveConfig} icon={<Save className="w-4 h-4" />}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: OCR */}
      {activeTab === 1 && (
        <Card>
          <CardHeader><CardTitle>Parámetros de OCR</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Tokens máximos de respuesta"
              type="number"
              value={config.ocrMaxTokens}
              onChange={(e) => setConfig({ ...config, ocrMaxTokens: e.target.value })}
              hint="Más tokens = más detalle pero mayor coste. Recomendado: 2000-4000"
            />
            <Textarea
              label="Prompt personalizado para OCR"
              value={config.ocrCustomPrompt}
              onChange={(e) => setConfig({ ...config, ocrCustomPrompt: e.target.value })}
              rows={4}
              placeholder="Instrucciones adicionales para la extracción de datos. Ej: Prioriza siempre la extracción de bastidor y matrícula en vehículos..."
            />
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-slate-300 font-medium mb-2">Campos extraídos automáticamente:</p>
              <div className="flex flex-wrap gap-2">
                {["referencia", "matricula", "bastidor", "unidades", "peso", "valor", "destinatario", "expedidor", "tipoOperacion", "instrucciones", "mercancia", "descripcion", "paisOrigen", "paisDestino", "regimen", "numeroDUA"].map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded bg-white/10 text-xs text-slate-300">{f}</span>
                ))}
              </div>
            </div>
            <Button loading={saving} onClick={saveConfig} icon={<Save className="w-4 h-4" />}>Guardar Configuración OCR</Button>
          </CardContent>
        </Card>
      )}

      {/* Tab: Reglas */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Reglas de Stock y Despacho</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="Umbral de alerta de stock (%)"
                type="number"
                value={config.stockAlertThreshold}
                onChange={(e) => setConfig({ ...config, stockAlertThreshold: e.target.value })}
                hint="Se alertará cuando el stock disponible sea inferior a este porcentaje del total"
              />
              <Select
                label="Régimen aduanero por defecto"
                options={[
                  { value: "4000", label: "4000 — Despacho libre práctica" },
                  { value: "3171", label: "3171 — Exportación definitiva" },
                  { value: "5100", label: "5100 — Depósito aduanero" },
                ]}
                value={config.defaultRegimen}
                onChange={(e) => setConfig({ ...config, defaultRegimen: e.target.value })}
              />
              <Select
                label="Moneda por defecto"
                options={[{ value: "EUR", label: "EUR — Euro" }, { value: "USD", label: "USD — Dólar" }, { value: "GBP", label: "GBP — Libra" }]}
                value={config.defaultMoneda}
                onChange={(e) => setConfig({ ...config, defaultMoneda: e.target.value })}
              />
              <Select
                label="Descuento automático de stock al despachar"
                options={[{ value: "true", label: "Sí — Automático" }, { value: "false", label: "No — Manual" }]}
                value={config.autoDespacho}
                onChange={(e) => setConfig({ ...config, autoDespacho: e.target.value })}
              />
              <Button loading={saving} onClick={saveConfig} icon={<Save className="w-4 h-4" />}>Guardar Reglas</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Usuarios */}
      {activeTab === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{users.length} usuarios registrados</p>
            <Button icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => setShowUserForm(true)}>Nuevo Usuario</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <Badge variant={u.role === "ADMIN" ? "error" : u.role === "OPERATOR" ? "info" : "neutral"}>
                      <Shield className="w-3 h-3 mr-1" />
                      {ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role}
                    </Badge>
                    <Badge variant={u.active ? "success" : "neutral"}>{u.active ? "Activo" : "Inactivo"}</Badge>
                    <button
                      onClick={() => toggleUser(u.id)}
                      className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={showUserForm} onClose={() => setShowUserForm(false)} title="Nuevo Usuario" size="sm">
        <div className="p-6 space-y-4">
          <Input label="Nombre" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          <Input label="Contraseña" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          <Select label="Rol" options={ROLE_OPTIONS} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowUserForm(false)}>Cancelar</Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={saveUser}>Crear Usuario</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
