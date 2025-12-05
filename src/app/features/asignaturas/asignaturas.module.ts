import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AsignaturasRoutingModule } from './asignaturas-routing.module';
import { AsignaturaListComponent } from './components/asignatura-list/asignatura-list.component';
import { AsignaturaFormComponent } from './components/asignatura-form/asignatura-form.component';
import { AsignaturaDetailComponent } from './components/asignatura-detail/asignatura-detail.component';
import { SharedComponentsModule } from '../../core/components/shared-components.module';

@NgModule({
  declarations: [
    AsignaturaListComponent,
    AsignaturaFormComponent,
    AsignaturaDetailComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AsignaturasRoutingModule,
    SharedComponentsModule
  ]
})
export class AsignaturasModule { }