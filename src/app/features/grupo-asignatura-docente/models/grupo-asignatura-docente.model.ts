export interface Carrera {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera: string;
}

export interface Grupo {
  id_grupo: number;
  codigo_grupo: string;
  nombre_grupo?: string;
  max_asignaturas?: number;
  min_asignaturas?: number;
  carrera: Carrera;
}

export interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  codigo_asignatura?: string;
}

export interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  codigo_docente?: string;
  email?: string;
}

export interface GrupoAsignaturaDocente {
  id_grupo_asignatura_docente: number;
  id_grupo: number;
  id_asignatura: number;
  id_docente: number;
  fecha_asignacion: Date;
  estado: string;
  observaciones?: string;
  
  // Campos de versionamiento y aprobación
  estado_aprobacion?: 'borrador' | 'pendiente_revision' | 'revisada' | 'pendiente_aprobacion' | 'aprobada' | 'rechazada';
  version_actual?: number;
  
  // Tracking de usuarios
  id_coordinador_carrera?: number;
  id_director_departamento?: number;
  id_administrador?: number;
  
  // Fechas del flujo
  fecha_creacion_inicial?: Date | string;
  fecha_revision?: Date | string;
  fecha_aprobacion_final?: Date | string;
  
  // Observaciones por rol
  observaciones_coordinador?: string;
  observaciones_director?: string;
  observaciones_administrador?: string;
  
  // Relaciones (ahora obligatorias)
  grupo: Grupo;
  asignatura: Asignatura;
  docente: Docente;
}

export interface AsignaturaDocenteItem {
  id_asignatura: number;
  id_docente: number;
}

export interface BulkCreateResponse {
  creadas: GrupoAsignaturaDocente[];
  errores: Array<{
    asignatura: number;
    docente: number;
    error: string;
  }>;
  total: number;
  exitosas: number;
  fallidas: number;
}

export interface CreateGrupoAsignaturaDocente {
  id_grupo: number;
  id_asignatura: number;
  id_docente: number;
  estado?: string;
  observaciones?: string;
}

export interface CreateBulkGrupoAsignaturaDocente {
  id_grupo: number;
  id_plan: number;
  asignaturas_docentes: AsignaturaDocenteItem[];
  estado?: string;
  observaciones?: string;
}

export interface QueryGrupoAsignaturaDocente {
  id_grupo?: number;
  id_asignatura?: number;
  id_docente?: number;
  estado?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface GrupoAsignaturaDocenteAgrupado {
  id_grupo: number;
  grupo: Grupo;
  asignaciones: GrupoAsignaturaDocente[];
}

export interface GrupoConAsignaciones {
  id_grupo: number;
  codigo_grupo: string;
  nombre_grupo?: string;
  periodo_academico?: string;
  carrera: Carrera;
  asignaciones: AsignacionGrupo[];
}

export interface AsignacionGrupo {
  id_grupo_asignatura_docente: number;
  asignatura: Asignatura;
  docente: Docente;
  fecha_asignacion: Date;
  estado: string;
  observaciones?: string;
  estado_aprobacion?: 'borrador' | 'pendiente_revision' | 'revisada' | 'pendiente_aprobacion' | 'aprobada' | 'rechazada';
  version_actual?: number;
}

// Modelos para versionamiento
export interface Usuario {
  id_usuario: number;
  username: string;
  email?: string;
  nombres?: string;
  apellidos?: string;
}

export interface CargaDocenteVersion {
  id_version: number;
  id_grupo_asignatura_docente: number;
  version: number;
  estado_version: 'inicial' | 'revisada' | 'aprobada';
  
  // Usuarios involucrados
  id_usuario_creador: number;
  id_usuario_revisor?: number;
  id_usuario_aprobador?: number;
  usuario_creador?: Usuario;
  usuario_revisor?: Usuario;
  usuario_aprobador?: Usuario;
  
  // Fechas
  fecha_creacion: Date | string;
  fecha_revision?: Date | string;
  fecha_aprobacion?: Date | string;
  
  // Datos de la versión
  datos_version: {
    id_grupo: number;
    id_asignatura: number;
    id_docente: number;
    estado: string;
    observaciones?: string;
  };
  
  // Cambios respecto a versión anterior
  cambios?: Array<{
    campo: string;
    valor_anterior: any;
    valor_nuevo: any;
  }>;
  
  observaciones?: string;
  activa: boolean;
}

export interface ComparacionVersiones {
  version1: CargaDocenteVersion;
  version2: CargaDocenteVersion;
  diferencias: Array<{
    campo: string;
    valor_v1: any;
    valor_v2: any;
  }>;
}

// DTOs para el flujo de aprobación
export interface CreateVersionInicialDto {
  id_grupo: number;
  id_asignatura: number;
  id_docente: number;
  estado?: string;
  observaciones?: string;
}

export interface EnviarRevisionDto {
  observaciones?: string;
}

export interface RevisarCargaDto {
  aprobado: boolean;
  observaciones?: string;
  cambios?: {
    id_docente?: number;
    estado?: string;
    observaciones?: string;
  };
}

export interface AprobarFinalDto {
  observaciones?: string;
}