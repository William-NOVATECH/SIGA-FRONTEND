export interface CreateCargaDocente {
  id_docente: number;
  id_grupo: number;
  tipo_vinculacion?: string;
  estado?: string;
  observaciones?: string;
}

export interface UpdateCargaDocente extends Partial<CreateCargaDocente> {}