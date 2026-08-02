/** Tipos de dominio del Saldito.
 *  Alineados con ESPECIFICACION_FUNCIONAL.md (secciones 1 y 2).
 *  IMPORTANTE: Deuda y Saldos son DERIVADOS de los gastos. Nunca se persisten. */

export type MonedaId = 'ARS' | 'USD';

/** Alias de legibilidad: las firmas de los algoritmos hablan de personas,
 *  no de strings sueltos. */
export type UsuarioId = string;

export const MONEDAS: readonly MonedaId[] = ['ARS', 'USD'];

export type ModoPago = 'iguales' | 'montos';
export type ModoReparto = 'iguales' | 'porcentaje' | 'montos';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  /** Alias o CBU para recibir transferencias. */
  alias: string;
  appPago: string;
  monedaPreferida: MonedaId;
  tarjetas: Tarjeta[];
}

export interface Tarjeta {
  id: string;
  usuarioId: string;
  nombre: string;
  /** Formato MM/AA. */
  vencimiento: string;
}

export interface Integrante {
  usuarioId: string;
  grupoId: string;
  rol: 'admin' | 'miembro';
  /** Un inactivo sigue en los históricos pero no en selectores nuevos. */
  activo: boolean;
  desactivadoEl?: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  creadoPor: string;
  creadoEl: string;
}

export interface Categoria {
  id: string;
  grupoId: string | null;
  nombre: string;
  /** Emoji. La app no usa librería de íconos. */
  icono: string;
  color: string;
  fondo: string;
}

export interface EdicionGasto {
  fecha: string;
  autorId: string;
  cambios: Record<string, { antes: unknown; despues: unknown }>;
}

export interface Gasto {
  id: string;
  grupoId: string;
  titulo: string;
  categoriaId: string;
  moneda: MonedaId;
  /** Entero positivo, sin centavos. */
  monto: number;
  fecha: string;

  /** Quién puso la plata. La suma de contribuciones es exactamente `monto`. */
  modoPago: ModoPago;
  contribuciones: Record<string, number>;

  /** Entre quiénes se reparte. La suma del reparto es exactamente `monto`. */
  modoReparto: ModoReparto;
  participantes: string[];
  reparto?: Record<string, number>;

  /** Baja lógica: nunca se borra un gasto. */
  anulado: boolean;
  anuladoPor?: string;
  anuladoEl?: string;
  editadoEl?: string;
  historial: EdicionGasto[];

  /** Si nació de una recurrencia y todavía no se confirmó, es borrador. */
  recurrenciaId?: string;
  borrador?: boolean;
  /** Pagadores que ya confirmaron que pusieron lo declarado. */
  confirmadoPor?: string[];
}

export interface Recurrencia {
  id: string;
  grupoId: string;
  titulo: string;
  categoriaId: string;
  moneda: MonedaId;
  /** Referencia del mes anterior. Nunca se aplica sin confirmación humana. */
  montoSugerido?: number;
  /** 1–28. No hay lógica de último día del mes. */
  diaDelMes: number;
  modoPago: ModoPago;
  contribuciones: Record<string, number>;
  modoReparto: ModoReparto;
  participantes: string[];
  reparto?: Record<string, number>;
  activa: boolean;
  creadaPor: string;
  ultimaGeneracion?: string;
}

export interface Pago {
  id: string;
  grupoId: string;
  deudorId: string;
  acreedorId: string;
  moneda: MonedaId;
  monto: number;
  fecha: string;
  registradoPor: string;
  /** false cuando lo declaró el deudor y el acreedor todavía no lo confirmó. */
  confirmado: boolean;
}

export interface Movimiento {
  id: string;
  deudorId: string;
  acreedorId: string;
  moneda: MonedaId;
  monto: number;
  hecho: boolean;
  hechoPor?: string;
  hechoEl?: string;
}

export type EstadoPlan = 'idle' | 'running' | 'completed';

export interface Plan {
  id: string;
  grupoId: string;
  estado: EstadoPlan;
  /** Congelados al iniciar. Pueden mezclar monedas. */
  movimientos: Movimiento[];
  gastoIds: string[];
  iniciadoPor: string;
  iniciadoEl: string;
}

export type TipoNotificacion =
  | 'gastoNuevo'
  | 'pagadorAsignado'
  | 'gastoEditado'
  | 'gastoAnulado'
  | 'pagoDeclarado'
  | 'pagoConfirmado'
  | 'recurrentePendiente'
  | 'planIniciado'
  | 'movimientoMarcado'
  | 'planCancelado'
  | 'planCompletado'
  | 'recordatorio'
  | 'grupo';

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  actorId?: string;
  texto: string;
  entidadId?: string;
  fecha: string;
  leida: boolean;
}

/** Deuda neta entre dos personas, en una moneda. Derivada, nunca persistida.
 *  Cuando un gasto tuvo varios pagadores, cada participante le debe a cada pagador
 *  en proporción a lo que ese pagador puso (ver especificación 1.4 y 2.3). */
export interface Deuda {
  deudorId: string;
  acreedorId: string;
  moneda: MonedaId;
  monto: number;
  /** Gastos que originaron esta deuda, para mostrar el detalle. */
  gastoIds: string[];
}

/** Saldo neto por integrante, separado por moneda. Derivado, nunca persistido.
 *  Invariantes: para cada moneda la suma de todos los saldos del grupo es cero,
 *  y el saldo de cada persona coincide con la suma de sus deudas por par. */
export type Saldos = Record<MonedaId, Record<string, number>>;

/** No hay pantalla de recurrentes: se administran inline dentro de Grupo. */
export type Pantalla =
  | 'inicio'
  | 'gastos'
  | 'gastoDetalle'
  | 'nuevoGasto'
  | 'editarGasto'
  | 'confirmarBorrador'
  | 'deudas'
  | 'grupo'
  | 'perfil'
  | 'notificaciones'
  | 'categorias';
