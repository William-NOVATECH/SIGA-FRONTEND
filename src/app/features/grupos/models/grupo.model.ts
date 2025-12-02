export interface Grupo {
  id_grupo: number;
  id_carrera: number;
  codigo_grupo: string;
  nombre_grupo?: string;
  periodo_academico: string;
  estado: string;
  min_asignaturas?: number;
  max_asignaturas?: number;
  
  // Relaciones
  carrera?: Carrera;
  asignaturas_docentes?: GrupoAsignaturaDocente[];
}

export interface GrupoAsignaturaDocente {
  id_grupo_asignatura_docente?: number;
  grupo?: Grupo;
  asignatura?: Asignatura;
  docente?: Docente;
  estado?: string;
}

export interface Carrera {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera: string;
  estado?: string;
}

export interface Asignatura {
  id_asignatura: number;
  id_carrera: number;
  codigo_asignatura: string;
  nombre_asignatura: string;
  creditos: number;
  estado?: string;
}

export interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  estado: string;
}

export interface CreateGrupoDto {
  id_carrera: number;
  codigo_grupo: string;
  nombre_grupo?: string;
  periodo_academico: string;
  min_asignaturas?: number;
  max_asignaturas?: number;
  estado?: string;
}

export interface UpdateGrupoDto extends Partial<CreateGrupoDto> {}

export interface QueryGrupoDto {
  search?: string;
  estado?: string;
  id_carrera?: number;
  periodo_academico?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// ✅ AGREGAR PaginatedResponse
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}