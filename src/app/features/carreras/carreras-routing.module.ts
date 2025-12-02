// features/carreras/carreras-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CarreraListComponent } from './components/carrera-list/carrera-list.component';
import { CarreraFormComponent } from './components/carrera-form/carrera-form.component';
import { CarreraDetailComponent } from './components/carrera-detail/carrera-detail.component';

const routes: Routes = [
  { path: '', component: CarreraListComponent },
  { path: 'crear', component: CarreraFormComponent },
  { path: 'editar/:id', component: CarreraFormComponent },
  { path: 'detalle/:id', component: CarreraDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CarrerasRoutingModule { }