import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { UserRolesComponent } from './components/user-roles/user-roles.component';
import { RoleCrudComponent } from './components/role-crud/role-crud.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { RoleManagementTableComponent } from './components/role-management-table/role-management-table.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'usuarios', component: UserManagementComponent },
      { path: 'roles', component: RoleManagementTableComponent },
      { path: 'usuarios-roles', component: UserRolesComponent },
      { path: 'gestion-roles', component: RoleCrudComponent },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }