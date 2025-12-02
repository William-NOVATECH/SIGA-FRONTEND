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