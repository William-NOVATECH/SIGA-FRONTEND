export interface CargaDocente {
  id_carga: number;
  id_docente: number;
  id_grupo: number;
  tipo_vinculacion: string;
  fecha_asignacion: Date;
  estado: string;
  observaciones?: string;
}

export interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  codigo_docente?: string;
  identificacion?: string;
  email?: string;
  telefono?: string;
  genero?: string;
  fecha_nacimiento?: string;
  fecha_ingreso?: string;
  estado?: string;
}

export interface Grupo {
  id_grupo: number;
  codigo_grupo: string;
  nombre_grupo?: string;
  periodo_academico?: string;
  estado?: string;
  asignatura?: Asignatura;
}

export interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  codigo_asignatura?: string;
  creditos?: number;
  carrera?: Carrera;
}

export interface Carrera {
  id_carrera: number;
  nombre: string;
  codigo?: string;
  duracion?: number;
}

export interface CargaDocenteWithRelations extends CargaDocente {
  docente?: Docente;
  grupo?: Grupo;
}