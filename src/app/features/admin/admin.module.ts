import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { UserRolesComponent } from './components/user-roles/user-roles.component';
import { RoleCrudComponent } from './components/role-crud/role-crud.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { RoleManagementTableComponent } from './components/role-management-table/role-management-table.component';
import { SharedComponentsModule } from '../../core/components/shared-components.module';

@NgModule({
  declarations: [
    RoleManagementComponent,
    UserRolesComponent,
    RoleCrudComponent,
    UserManagementComponent,
    RoleManagementTableComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedComponentsModule
  ]
})
export class AdminModule { }