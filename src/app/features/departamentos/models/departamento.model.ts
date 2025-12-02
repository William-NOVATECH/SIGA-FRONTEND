export interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
  codigo_departamento: string;
  estado: string;
}

export interface CreateDepartamento {
  nombre_departamento: string;
  codigo_departamento: string;
  estado?: string;
}

export interface UpdateDepartamento {
  nombre_departamento?: string;
  codigo_departamento?: string;
  estado?: string;
}

export interface QueryDepartamento {
  search?: string;
  estado?: 'activo' | 'inactivo';
  orderBy?: 'nombre_departamento' | 'codigo_departamento' | 'id_departamento';
  orderDirection?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface DepartamentoResponse {
  data: Departamento[];
  total: number;
  page: number;
  limit: number;
}