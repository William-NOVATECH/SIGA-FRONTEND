import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocentesPageComponent } from './pages/docentes-page/docentes-page.component';
import { CargosDocentePageComponent } from './pages/cargos-docente-page/cargos-docente-page.component';

const routes: Routes = [
  {
    path: '',
    component: DocentesPageComponent
  },
  {
    path: 'cargos',
    component: CargosDocentePageComponent
  },
  {
    path: 'nuevo',
    component: DocentesPageComponent
  },
  {
    path: 'editar/:id',
    component: DocentesPageComponent
  },
  {
    path: 'detalle/:id',
    component: DocentesPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocentesRoutingModule { }