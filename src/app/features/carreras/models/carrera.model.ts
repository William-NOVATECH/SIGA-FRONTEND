export interface DepartamentoDto {
  id_departamento: number;
  nombre_departamento: string;
}

export interface AsignaturaDto {
  id_asignatura: number;
  nombre_asignatura: string;
  codigo_asignatura: string;
}

export interface Carrera {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera: string;
  duracion_semestres?: number;
  titulo_otorga?: string;
  estado: string;
  departamento: DepartamentoDto;
  asignaturas?: AsignaturaDto[];
}

export interface CreateCarrera {
  nombre_carrera: string;
  codigo_carrera: string;
  duracion_semestres?: number;
  titulo_otorga?: string;
  estado?: string;
  id_departamento: number;
}

export interface UpdateCarrera {
  nombre_carrera?: string;
  codigo_carrera?: string;
  duracion_semestres?: number;
  titulo_otorga?: string;
  estado?: string;
  id_departamento?: number;
}

export interface CarreraResponse {
  message: string;
  data: Carrera | Carrera[];
}