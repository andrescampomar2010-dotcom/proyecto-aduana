# AduanaSaaS — Plataforma de Gestión Aduanera

Plataforma SaaS moderna para la gestión integral de procesos aduaneros con IA.

## Stack Técnico

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Node.js
- **Base de datos**: PostgreSQL + Prisma ORM v7
- **IA**: Claude API (Anthropic) — OCR y comprensión documental
- **UI**: Diseño glassmorphism premium, tema oscuro

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | KPIs en tiempo real, actividad reciente, accesos rápidos |
| **Documentos** | Subida y OCR automático con Claude AI |
| **DUAs** | Gestión completa de Documentos Únicos Administrativos |
| **LAME/DVD** | Control de movimientos en depósito aduanero |
| **Depósito** | Stock, cruce automático y motor de despacho |
| **Intrastat** | Extracción automática de datos para declaraciones UE |
| **Configuración** | API Key Claude, parámetros OCR, usuarios, reglas |

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar DATABASE_URL y ANTHROPIC_API_KEY

# 3. Generar cliente Prisma
npm run db:generate

# 4. Crear tablas en la base de datos
npm run db:push

# 5. Cargar datos de ejemplo (opcional)
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

```env
DATABASE_URL="postgresql://user:password@localhost:5432/aduana_saas"
ANTHROPIC_API_KEY="sk-ant-api03-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Características Principales

### OCR con Claude AI
Los documentos subidos (PDF, imágenes, Excel) se procesan automáticamente con Claude API para extraer: referencia, matrícula, bastidor, unidades, peso, valor, destinatario, instrucciones de despacho, etc.

### Motor de Cruce Automático
Al ejecutar un despacho, el sistema:
1. Valida stock disponible
2. Descuenta unidades automáticamente
3. Registra el movimiento
4. Alerta ante discrepancias

### Intrastat Automático
Sube un PDF con múltiples facturas y Claude extrae automáticamente todos los datos para las declaraciones INTRASTAT de la UE.

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/documentos` | Gestión de documentos + OCR |
| GET/POST | `/api/duas` | DUAs |
| PUT/DELETE | `/api/duas/[id]` | Editar/eliminar DUA |
| GET/POST | `/api/lame` | Movimientos LAME/DVD |
| GET/POST | `/api/deposito` | Stock en depósito |
| POST | `/api/deposito/[id]/despacho` | Ejecutar despacho automático |
| GET/POST | `/api/intrastat` | Registros Intrastat |
| POST | `/api/intrastat/ocr` | Extracción Intrastat con IA |
| GET/PUT | `/api/config` | Configuración del sistema |
| POST | `/api/config/test` | Probar conexión Claude API |

## Estructura del Proyecto

```
src/
├── app/                    # App Router (páginas y API routes)
│   ├── api/               # Backend endpoints
│   ├── dashboard/         # Módulo Dashboard
│   ├── documentos/        # Módulo Documentos
│   ├── duas/              # Módulo DUAs
│   ├── lame/              # Módulo LAME/DVD
│   ├── deposito/          # Módulo Depósito
│   ├── intrastat/         # Módulo Intrastat
│   └── configuracion/     # Módulo Configuración
├── components/
│   ├── layout/            # Sidebar, Header, MainLayout
│   ├── modules/           # Componentes de cada módulo
│   └── ui/                # Badge, Button, Card, Input, Modal, Table...
├── lib/
│   ├── prisma.ts          # Cliente Prisma con adaptador pg
│   ├── claude.ts          # Integración Claude API (OCR, Intrastat, Cruce)
│   └── utils.ts           # Utilidades (formato, constantes)
└── types/                 # Tipos TypeScript
prisma/
├── schema.prisma          # Modelos de base de datos
└── seed.ts                # Datos iniciales
```
