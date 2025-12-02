export interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion?: string;
  nivel_acceso: number;
}

export interface CreateRol {
  nombre_rol: string;
  descripcion?: string;
  nivel_acceso?: number;
}

export interface UpdateRol {
  nombre_rol?: string;
  descripcion?: string;
  nivel_acceso?: number;
}

export interface QueryRol {
  search?: string;
  nivel_acceso?: number;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}