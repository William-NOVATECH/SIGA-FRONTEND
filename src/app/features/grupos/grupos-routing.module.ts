import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrupoListComponent } from './components/grupo-list/grupo-list.component';
import { GrupoFormComponent } from './components/grupo-form/grupo-form.component';
import { GrupoDetailComponent } from './components/grupo-detail/grupo-detail.component';

const routes: Routes = [
  { path: '', component: GrupoListComponent },
  { path: 'new', component: GrupoFormComponent },
  { path: ':id', component: GrupoDetailComponent },
  { path: ':id/edit', component: GrupoFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GruposRoutingModule { }