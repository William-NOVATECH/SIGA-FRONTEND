import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { UserRolesComponent } from './components/user-roles/user-roles.component';
import { RoleCrudComponent } from './components/role-crud/role-crud.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'roles', component: RoleManagementComponent },
      { path: 'usuarios-roles', component: UserRolesComponent },
      { path: 'gestion-roles', component: RoleCrudComponent },
      { path: '', redirectTo: 'usuarios-roles', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }