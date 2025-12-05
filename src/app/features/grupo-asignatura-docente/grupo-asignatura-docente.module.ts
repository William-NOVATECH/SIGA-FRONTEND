import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

// Components
import { GrupoAsignaturaDocenteListComponent } from './grupo-asignatura-docente-list/grupo-asignatura-docente-list.component';
import { GrupoAsignaturaDocenteGroupedListComponent } from './grupo-asignatura-docente-grouped-list/grupo-asignatura-docente-grouped-list.component';
import { GrupoAsignaturaDocenteFormComponent } from './grupo-asignatura-docente-form/grupo-asignatura-docente-form.component';
import { GrupoAsignaturaDocenteBulkFormComponent } from './grupo-asignatura-docente-bulk-form/grupo-asignatura-docente-bulk-form.component';

// Pages
import { ListGrupoAsignaturaDocentePage } from './Pages/list-grupo-asignatura-docente/list-grupo-asignatura-docente.page';
import { ManageGrupoAsignaturaDocentePage } from './Pages/manage-grupo-asignatura-docente/manage-grupo-asignatura-docente.page';
import { DetailGrupoAsignaturaDocentePage } from './Pages/detail-grupo-asignatura-docente/detail-grupo-asignatura-docente.page';

// Routing
import { GRUPO_ASIGNATURA_DOCENTE_ROUTES } from './grupo-asignatura-docente.routes';

@NgModule({
  declarations: [
    // Components
    GrupoAsignaturaDocenteListComponent,
    GrupoAsignaturaDocenteGroupedListComponent,
    GrupoAsignaturaDocenteFormComponent,
    GrupoAsignaturaDocenteBulkFormComponent,
    // Pages
    ListGrupoAsignaturaDocentePage,
    ManageGrupoAsignaturaDocentePage,
    DetailGrupoAsignaturaDocentePage
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(GRUPO_ASIGNATURA_DOCENTE_ROUTES),
    HttpClientModule
  ],
  exports: [
    GrupoAsignaturaDocenteListComponent,
    GrupoAsignaturaDocenteGroupedListComponent,
    GrupoAsignaturaDocenteFormComponent,
    GrupoAsignaturaDocenteBulkFormComponent
  ]
})
export class GrupoAsignaturaDocenteModule { }

