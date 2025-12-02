import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { UserRolesComponent } from './components/user-roles/user-roles.component';
import { RoleCrudComponent } from './components/role-crud/role-crud.component';

@NgModule({
  declarations: [
    RoleManagementComponent,
    UserRolesComponent,
    RoleCrudComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class AdminModule { }