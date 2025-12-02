import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { GrupoListComponent } from './components/grupo-list/grupo-list.component';
import { GrupoFormComponent } from './components/grupo-form/grupo-form.component';
import { GrupoDetailComponent } from './components/grupo-detail/grupo-detail.component';

@NgModule({
  declarations: [
    GrupoListComponent,
    GrupoFormComponent,
    GrupoDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // ← AÑADIR ESTA LÍNEA
    RouterModule.forChild([
      { path: '', component: GrupoListComponent },
      { path: 'new', component: GrupoFormComponent },
      { path: ':id', component: GrupoDetailComponent },
      { path: ':id/edit', component: GrupoFormComponent }
    ])
  ]
})
export class GruposModule { }