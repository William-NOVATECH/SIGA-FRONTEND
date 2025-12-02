import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { ManagePageComponent } from './pages/manage-page/manage-page.component';

const routes: Routes = [
  { path: '', component: ListPageComponent },
  { path: 'nuevo', component: ManagePageComponent },
  { path: 'editar/:id', component: ManagePageComponent },
  { path: 'detalles/:id', component: ManagePageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CargaDocenteRoutingModule { }