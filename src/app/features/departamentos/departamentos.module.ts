import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { DepartamentosRoutingModule } from './departamentos-routing.module';
import { DepartamentoListComponent } from './components/departamento-list/departamento-list.component';
import { DepartamentoFormComponent } from './components/departamento-form/departamento-form.component';
import { SharedComponentsModule } from '../../core/components/shared-components.module';

@NgModule({
  declarations: [
    DepartamentoListComponent,
    DepartamentoFormComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    DepartamentosRoutingModule,
    FormsModule,
    RouterModule,
    SharedComponentsModule
  ]
})
export class DepartamentosModule { }