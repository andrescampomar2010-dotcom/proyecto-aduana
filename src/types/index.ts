export type { User, Document, DUA, DepositStock, DepositMovement, LAME, IntrastatRecord, AILog, Configuration } from "@prisma/client";

export interface DashboardStats {
  duasPendientes: number;
  duasProcesados: number;
  depositosActivos: number;
  unidadesEnDeposito: number;
  discrepancias: number;
  documentosPendientes: number;
  stockTotal: number;
  movimientosHoy: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OCRResult {
  referencia?: string;
  matricula?: string;
  bastidor?: string;
  unidades?: number;
  peso?: number;
  valor?: number;
  moneda?: string;
  destinatario?: string;
  expedidor?: string;
  tipoOperacion?: string;
  instruccionesDespacho?: string;
  mercancia?: string;
  descripcion?: string;
  paisOrigen?: string;
  paisDestino?: string;
  aduanaEntrada?: string;
  aduanaSalida?: string;
  regimen?: string;
  numeroDUA?: string;
  codigoMercancia?: string;
}

export interface StockAlert {
  stockId: string;
  referencia: string;
  producto: string;
  unidadesDisponibles: number;
  unidadesRequeridas: number;
  deficit: number;
  tipo: "DEFICIT" | "ADVERTENCIA";
}
