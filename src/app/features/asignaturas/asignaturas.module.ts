import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AsignaturasRoutingModule } from './asignaturas-routing.module';
import { AsignaturaListComponent } from './components/asignatura-list/asignatura-list.component';
import { AsignaturaFormComponent } from './components/asignatura-form/asignatura-form.component';
import { AsignaturaDetailComponent } from './components/asignatura-detail/asignatura-detail.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    AsignaturasRoutingModule,
    AsignaturaListComponent,
    AsignaturaFormComponent,
    AsignaturaDetailComponent
  ]
})
export class AsignaturasModule { }