import { Routes } from '@angular/router';
import { ListGrupoAsignaturaDocentePage } from './Pages/list-grupo-asignatura-docente/list-grupo-asignatura-docente.page';
import { ManageGrupoAsignaturaDocentePage } from './Pages/manage-grupo-asignatura-docente/manage-grupo-asignatura-docente.page';
import { DetailGrupoAsignaturaDocentePage } from './Pages/detail-grupo-asignatura-docente/detail-grupo-asignatura-docente.page';

export const GRUPO_ASIGNATURA_DOCENTE_ROUTES: Routes = [
  {
    path: '',
    component: ListGrupoAsignaturaDocentePage
  },
  {
    path: 'create',
    component: ManageGrupoAsignaturaDocentePage
  },
  {
    path: 'bulk-create',
    component: ManageGrupoAsignaturaDocentePage
  },
  {
    path: 'edit/:id',
    component: ManageGrupoAsignaturaDocentePage
  },
   {
    path: 'detail/:id',
    component: DetailGrupoAsignaturaDocentePage
  }
];


