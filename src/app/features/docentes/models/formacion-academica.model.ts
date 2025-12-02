export interface FormacionAcademica {
  id_formacion: number;
  id_docente: number;
  nivel_formacion: string;
  titulo: string;
  institucion: string;
  anio_graduacion?: number;  
  pais?: string;
  documento_titulo?: string;
  docente?: any;
}

export interface CreateFormacionAcademicaDto {
  id_docente: number;
  nivel_formacion: string;
  titulo: string;
  institucion: string;
  anio_graduacion?: number;  
  pais?: string;
  documento_titulo?: string;
}

export interface UpdateFormacionAcademicaDto extends Partial<CreateFormacionAcademicaDto> {}