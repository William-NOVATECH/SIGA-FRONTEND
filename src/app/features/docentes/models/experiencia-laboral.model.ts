export interface ExperienciaLaboral {
  id_experiencia: number;
  id_docente: number;
  cargo_ejercido: string;
  institucion_empresa: string;
  fecha_inicio: string;
  fecha_fin?: string;
  descripcion_funciones?: string;
  docente?: any;
}

export interface CreateExperienciaLaboralDto {
  id_docente: number;
  cargo_ejercido: string;
  institucion_empresa: string;
  fecha_inicio: string;
  fecha_fin?: string;
  descripcion_funciones?: string;
}

export interface UpdateExperienciaLaboralDto extends Partial<CreateExperienciaLaboralDto> {}