import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PlanesRoutingModule } from './planes-routing.module';

// Components
import { PlanListComponent } from './components/plan-list/plan-list.component';
import { PlanFormComponent } from './components/plan-form/plan-form.component';
import { PlanDetailComponent } from './components/plan-detail/plan-detail.component';

// Pages
import { PlanListPageComponent } from './pages/list-page/list-page.component';
import { PlanManagePageComponent } from './pages/manage-page/manage-page.component';

// Shared
import { SharedComponentsModule } from '../../core/components/shared-components.module';

@NgModule({
  declarations: [
    PlanListComponent,
    PlanFormComponent,
    PlanDetailComponent,
    PlanListPageComponent,
    PlanManagePageComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PlanesRoutingModule,
    SharedComponentsModule
  ]
})
export class PlanesModule { }

