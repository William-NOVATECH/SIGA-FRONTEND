import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { PlanService } from '../../services/plan.service';
import { Plan } from '../../models/plan.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-plan-list',
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.css']
})
export class PlanListComponent implements OnInit {
  @Output() view = new EventEmitter<number>();
  @Output() edit = new EventEmitter<number>();
  @Output() create = new EventEmitter<void>();

  planes: Plan[] = [];
  loading = false;
  error = '';

  constructor(
    private planService: PlanService,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadPlanes();
  }

  loadPlanes(): void {
    this.loading = true;
    this.error = '';

    this.planService.findAll().subscribe({
      next: (planes) => {
        this.planes = planes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los planes';
        this.loading = false;
        this.toastService.showError('Error', 'No se pudieron cargar los planes.');
        console.error('Error loading planes:', err);
      }
    });
  }

  onView(id: number): void {
    this.view.emit(id);
  }

  onEdit(id: number): void {
    this.edit.emit(id);
  }

  onCreate(): void {
    this.create.emit();
  }

  onDelete(id: number): void {
    const plan = this.planes.find(p => p.id_plan === id);
    const planNombre = plan ? plan.nombre_plan : 'este plan';

    this.confirmService.confirmDelete(
      () => {
        this.planService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Plan eliminado', `El plan "${planNombre}" se ha eliminado correctamente.`);
            this.loadPlanes();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || err.message || 'No se pudo eliminar el plan.';
            this.toastService.showError('Error al eliminar', errorMessage);
            console.error('Error deleting plan:', err);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar el plan "${planNombre}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación de plan'
    );
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  }

  getAnio(plan: Plan): number | undefined {
    return (plan as any).año;
  }

  getFechaInicio(plan: Plan): Date | string | undefined {
    return plan.fecha_inicio;
  }

  getFechaFin(plan: Plan): Date | string | undefined {
    return plan.fecha_fin;
  }
}

