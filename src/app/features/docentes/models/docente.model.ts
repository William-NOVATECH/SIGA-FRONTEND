import { ExperienciaLaboral } from "./experiencia-laboral.model";
import { FormacionAcademica } from "./formacion-academica.model";

export interface Docente {
  id_docente: number;
  id_departamento: number;
  id_cargo: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  fecha_nacimiento?: string;
  genero?: string;
  estado?: string;
  fecha_ingreso?: string;
  departamento?: any;
  cargo?: any;
  formaciones?: FormacionAcademica[];
  experiencias?: ExperienciaLaboral[];
}

export interface CreateDocenteDto {
  id_departamento: number;
  id_cargo: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  fecha_nacimiento?: string;
  genero?: string;
  estado?: string;
  fecha_ingreso?: string;
}

export interface UpdateDocenteDto extends Partial<CreateDocenteDto> {}

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