export interface QueryCargaDocente {
  idDocente?: number;
  idGrupo?: number;
  tipo_vinculacion?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface CargaDocenteResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}