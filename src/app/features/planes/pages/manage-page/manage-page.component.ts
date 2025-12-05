import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanService } from '../../services/plan.service';
import { Plan } from '../../models/plan.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-plan-manage-page',
  templateUrl: './manage-page.component.html',
  styleUrls: ['./manage-page.component.css']
})
export class PlanManagePageComponent implements OnInit {
  planId?: number;
  mode: 'create' | 'edit' = 'create';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planService: PlanService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.planId = +params['id'];
        this.mode = 'edit';
      } else {
        this.mode = 'create';
      }
    });
  }

  onSaved(plan: Plan): void {
    this.router.navigate(['/planes', 'detail', plan.id_plan]);
  }

  onCancel(): void {
    this.router.navigate(['/planes']);
  }
}

