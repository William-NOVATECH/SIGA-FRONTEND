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
}