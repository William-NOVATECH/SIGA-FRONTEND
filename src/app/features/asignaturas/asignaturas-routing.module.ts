import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsignaturaListComponent } from './components/asignatura-list/asignatura-list.component';
import { AsignaturaFormComponent } from './components/asignatura-form/asignatura-form.component';
import { AsignaturaDetailComponent } from './components/asignatura-detail/asignatura-detail.component';

const routes: Routes = [
  { path: '', component: AsignaturaListComponent },
  { path: 'crear', component: AsignaturaFormComponent },
  { path: 'editar/:id', component: AsignaturaFormComponent },
  { path: 'detalle/:id', component: AsignaturaDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AsignaturasRoutingModule { }