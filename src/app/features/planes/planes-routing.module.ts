import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanListPageComponent } from './pages/list-page/list-page.component';
import { PlanManagePageComponent } from './pages/manage-page/manage-page.component';
import { PlanDetailComponent } from './components/plan-detail/plan-detail.component';

const routes: Routes = [
  {
    path: '',
    component: PlanListPageComponent
  },
  {
    path: 'create',
    component: PlanManagePageComponent
  },
  {
    path: 'edit/:id',
    component: PlanManagePageComponent
  },
  {
    path: 'detail/:id',
    component: PlanDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlanesRoutingModule { }

