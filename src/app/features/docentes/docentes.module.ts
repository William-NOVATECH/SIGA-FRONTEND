import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DocentesRoutingModule } from './docentes-routing.module';

// Components
import { DocenteFormComponent } from './components/docente-form/docente-form.component';
import { DocenteListComponent } from './components/docente-list/docente-list.component';
import { DocenteDetailComponent } from './components/docente-detail/docente-detail.component';
import { CargoDocenteFormComponent } from './components/cargo-docente-form/cargo-docente-form.component';
import { CargoDocenteListComponent } from './components/cargo-docente-list/cargo-docente-list.component';
import { FormacionAcademicaFormComponent } from './components/formacion-academica-form/formacion-academica-form.component';
import { ExperienciaLaboralFormComponent } from './components/experiencia-laboral-form/experiencia-laboral-form.component';

// Pages
import { DocentesPageComponent } from './pages/docentes-page/docentes-page.component';
import { CargosDocentePageComponent } from './pages/cargos-docente-page/cargos-docente-page.component';

@NgModule({
  declarations: [
    // Components
    DocenteFormComponent,
    DocenteListComponent,
    DocenteDetailComponent,
    CargoDocenteFormComponent,
    CargoDocenteListComponent,
    FormacionAcademicaFormComponent,
    ExperienciaLaboralFormComponent,
    
    // Pages
    DocentesPageComponent,
    CargosDocentePageComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,  // Para formGroup
    FormsModule,          // Para ngModel
    RouterModule,
    DocentesRoutingModule
  ],
  exports: [
    DocentesPageComponent,
    CargosDocentePageComponent
  ]
})
export class DocentesModule { }