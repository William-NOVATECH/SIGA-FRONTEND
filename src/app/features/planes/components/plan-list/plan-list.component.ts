import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { PlanService } from '../../services/plan.service';
import { Plan } from '../../models/plan.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ExportService } from '../../../../core/services/export.service';

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
    private confirmService: ConfirmService,
    private exportService: ExportService
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

  getCarrera(plan: Plan): any | undefined {
    if (plan.carreras && plan.carreras.length > 0) {
      return plan.carreras[0].carrera;
    }
    return undefined;
  }

  exportToCSV(): void {
    if (this.planes.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    const csvHeaders = ['ID', 'Nombre', 'Código', 'Año', 'Carrera', 'Código Carrera', 'Fecha Inicio', 'Fecha Fin', 'Estado'];
    const csvData = this.planes.map(p => ({
      'ID': p.id_plan,
      'Nombre': p.nombre_plan || 'N/A',
      'Código': p.codigo_plan || 'N/A',
      'Año': p.año || 'N/A',
      'Carrera': this.getCarrera(p)?.nombre_carrera || 'Sin carrera',
      'Código Carrera': this.getCarrera(p)?.codigo_carrera || 'N/A',
      'Fecha Inicio': this.formatDate(p.fecha_inicio),
      'Fecha Fin': this.formatDate(p.fecha_fin),
      'Estado': p.estado || 'N/A'
    }));

    this.exportService.exportToCSV(csvData, 'planes', csvHeaders);
    this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a CSV correctamente.');
  }

  async exportToPDF(): Promise<void> {
    if (this.planes.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    try {
      const pdfData = this.planes.map(p => ({
        'Nombre': p.nombre_plan || 'N/A',
        'Código': p.codigo_plan || 'N/A',
        'Año': p.año || 'N/A',
        'Carrera': this.getCarrera(p)?.nombre_carrera || 'Sin carrera',
        'Código Carrera': this.getCarrera(p)?.codigo_carrera || 'N/A',
        'Fecha Inicio': this.formatDate(p.fecha_inicio),
        'Fecha Fin': this.formatDate(p.fecha_fin),
        'Estado': p.estado || 'N/A'
      }));

      await this.exportService.exportToPDF(
        pdfData,
        'planes',
        'Reporte de Planes Académicos',
        ['Nombre', 'Código', 'Año', 'Carrera', 'Código Carrera', 'Fecha Inicio', 'Fecha Fin', 'Estado']
      );
      this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a PDF correctamente.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.toastService.showError('Error al exportar', 'No se pudo exportar a PDF. Por favor, intente nuevamente.');
    }
  }
}

