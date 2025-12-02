export interface QueryDocenteDto {
  search?: string;
  estado?: string;
  id_departamento?: number;
  id_cargo?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}