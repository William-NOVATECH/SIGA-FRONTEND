export interface GrupoAsignaturaDocente {
  id_grupo_asignatura_docente: number;
  id_grupo: number;
  id_asignatura: number;
  id_docente: number;
  fecha_asignacion: Date;
  estado: string;
  observaciones?: string;
  
  // Relaciones
  grupo?: {
    id_grupo: number;
    codigo_grupo: string;
    nombre_grupo?: string;
    max_asignaturas?: number;
    min_asignaturas?: number;
    carrera?: {
      id_carrera: number;
      nombre_carrera: string;
      codigo_carrera?: string;
    };
  };
  asignatura?: {
    id_asignatura: number;
    nombre_asignatura: string;
    codigo_asignatura?: string;
  };
  docente?: {
    id_docente: number;
    nombres: string;
    apellidos: string;
    codigo_docente?: string;
    email?: string;
  };
}

export interface CreateGrupoAsignaturaDocente {
  id_grupo: number;
  id_asignatura: number;
  id_docente: number;
  estado?: string;
  observaciones?: string;
}