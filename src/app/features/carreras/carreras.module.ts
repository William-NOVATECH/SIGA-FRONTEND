// features/carreras/carreras.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { CarrerasRoutingModule } from './carreras-routing.module';
import { CarreraListComponent } from './components/carrera-list/carrera-list.component';
import { CarreraFormComponent } from './components/carrera-form/carrera-form.component';
import { CarreraDetailComponent } from './components/carrera-detail/carrera-detail.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    CarrerasRoutingModule,
    CarreraListComponent,
    CarreraFormComponent,
    CarreraDetailComponent
  ]
})
export class CarrerasModule { }