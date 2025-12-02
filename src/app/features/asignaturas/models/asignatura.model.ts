export interface CarreraDto {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera: string;
}

export interface Asignatura {
  id_asignatura: number;
  id_carrera: number;
  codigo_asignatura: string;
  nombre_asignatura: string;
  creditos: number;
  horas_semanales: number;
  semestre?: number;
  tipo: string;
  estado: string;
  prerequisitos?: string;
  carrera?: CarreraDto;
}

export interface CreateAsignatura {
  id_carrera: number;
  codigo_asignatura: string;
  nombre_asignatura: string;
  creditos: number;
  horas_semanales: number;
  semestre?: number;
  tipo?: string;
  estado?: string;
  prerequisitos?: string;
}

export interface UpdateAsignatura {
  id_carrera?: number;
  codigo_asignatura?: string;
  nombre_asignatura?: string;
  creditos?: number;
  horas_semanales?: number;
  semestre?: number;
  tipo?: string;
  estado?: string;
  prerequisitos?: string;
}