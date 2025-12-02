import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { CargaDocenteRoutingModule } from './carga-docente-routing.module';

// Components
import { CargaDocenteListComponent } from './components/carga-docente-list/carga-docente-list.component';
import { CargaDocenteFormComponent } from './components/carga-docente-form/carga-docente-form.component';
import { CargaDocenteDetailsComponent } from './components/carga-docente-details/carga-docente-details.component';

// Pages
import { ListPageComponent } from './pages/list-page/list-page.component';
import { ManagePageComponent } from './pages/manage-page/manage-page.component';

// Services
import { DocenteService } from './services/docente.service';
import { GrupoService } from './services/grupo.service';

@NgModule({
  declarations: [
    CargaDocenteListComponent,
    CargaDocenteFormComponent,
    CargaDocenteDetailsComponent,
    ListPageComponent,
    ManagePageComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    CargaDocenteRoutingModule
  ],
  providers: [
    DocenteService,
    GrupoService
  ]
})
export class CargaDocenteModule { }