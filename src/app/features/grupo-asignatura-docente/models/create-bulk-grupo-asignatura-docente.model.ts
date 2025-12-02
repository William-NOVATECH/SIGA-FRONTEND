import { AsignaturaDocenteItem } from './grupo-asignatura-docente.model';

export interface CreateBulkGrupoAsignaturaDocente {
  id_grupo: number;
  asignaturas_docentes: AsignaturaDocenteItem[];
  estado?: string;
  observaciones?: string;
}