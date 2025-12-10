import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanService } from '../../services/plan.service';
import { PlanCarreraService } from '../../services/plan-carrera.service';
import { PlanCarreraAsignaturaService } from '../../services/plan-carrera-asignatura.service';
import { CarreraService } from '../../../carreras/services/carrera.service';
import { AsignaturaService } from '../../../asignaturas/services/asignatura.service';
import { Plan, PlanCarrera, PlanCarreraAsignatura, Carrera, Asignatura, PlanWithDetails } from '../../models/plan.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-plan-detail',
  templateUrl: './plan-detail.component.html',
  styleUrls: ['./plan-detail.component.css']
})
export class PlanDetailComponent implements OnInit {
  plan: Plan | PlanWithDetails | null = null;
  planCarreras: PlanCarrera[] = [];
  loading = false;
  error = '';

  // Para agregar carreras
  showAddCarreraModal = false;
  availableCarreras: Carrera[] = [];
  selectedCarreras: number[] = [];
  loadingCarreras = false;

  // Para agregar asignaturas
  showAddAsignaturaModal = false;
  selectedPlanCarrera: PlanCarrera | null = null;
  availableAsignaturas: Asignatura[] = [];
  selectedAsignaturas: number[] = [];
  loadingAsignaturas = false;

  // Para expandir/colapsar carreras
  expandedCarreras: Set<number> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planService: PlanService,
    private planCarreraService: PlanCarreraService,
    private planCarreraAsignaturaService: PlanCarreraAsignaturaService,
    private carreraService: CarreraService,
    private asignaturaService: AsignaturaService,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadPlan();
  }

  loadPlan(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error = 'ID de plan no válido';
      return;
    }

    this.loading = true;
    this.error = '';

    this.planService.findOneWithDetails(id).subscribe({
      next: (planWithDetails) => {
        this.plan = planWithDetails;
        this.planCarreras = planWithDetails.carreras || [];
        this.loading = false;
      },
      error: (err) => {
        // Si el endpoint de details no existe, cargar plan y carreras por separado
        this.planService.findOne(id).subscribe({
          next: (plan) => {
            this.plan = plan;
            this.loadPlanCarreras(id);
          },
          error: (error) => {
            this.error = 'Error al cargar el plan';
            this.loading = false;
            this.toastService.showError('Error', 'No se pudo cargar el plan.');
            console.error('Error loading plan:', error);
          }
        });
      }
    });
  }

  loadPlanCarreras(planId: number): void {
    this.planCarreraService.findByPlan(planId).subscribe({
      next: (planCarreras) => {
        this.planCarreras = planCarreras;
        // Cargar asignaturas para cada carrera
        this.planCarreras.forEach(pc => {
          this.loadAsignaturasForCarrera(pc.id_plan_carrera);
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading plan carreras:', err);
      }
    });
  }

  loadAsignaturasForCarrera(idPlanCarrera: number): void {
    if (!this.plan) return;
    
    this.planCarreraAsignaturaService.findByPlanCarrera(this.plan.id_plan, idPlanCarrera).subscribe({
      next: (asignaturas) => {
        const planCarrera = this.planCarreras.find(pc => pc.id_plan_carrera === idPlanCarrera);
        if (planCarrera) {
          (planCarrera as any).asignaturas = asignaturas;
        }
      },
      error: (err) => {
        console.error('Error loading asignaturas:', err);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/planes']);
  }

  onEdit(): void {
    if (this.plan) {
      this.router.navigate(['/planes', 'edit', this.plan.id_plan]);
    }
  }

  onAddCarrera(): void {
    // Verificar si ya existe una carrera en el plan
    if (this.planCarreras.length > 0) {
      const carreraActual = this.planCarreras[0].carrera;
      const carreraActualNombre = carreraActual?.nombre_carrera || 'la carrera actual';
      
      this.confirmService.confirm({
        message: `Este plan ya tiene una carrera asignada: "${carreraActualNombre}". Al agregar una nueva carrera, se eliminará la actual y será reemplazada por la seleccionada. ¿Deseas continuar?`,
        header: 'Reemplazar Carrera',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, reemplazar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-warning',
        acceptCallback: () => {
          // Usuario confirmó, proceder a cargar carreras para reemplazar
          this.loadCarrerasForReplacement();
        },
        rejectCallback: () => {
          // Usuario canceló, no hacer nada
        }
      });
    } else {
      // No hay carrera, cargar normalmente
      this.loadCarrerasForReplacement();
    }
  }

  loadCarrerasForReplacement(): void {
    this.loadingCarreras = true;
    this.carreraService.findAll().subscribe({
      next: (response: any) => {
        const carreras = Array.isArray(response.data) ? response.data : [response.data];
        // Mostrar todas las carreras disponibles (ya que vamos a reemplazar)
        this.availableCarreras = carreras;
        this.selectedCarreras = [];
        this.showAddCarreraModal = true;
        this.loadingCarreras = false;
      },
      error: (err) => {
        this.loadingCarreras = false;
        this.toastService.showError('Error', 'No se pudieron cargar las carreras.');
        console.error('Error loading carreras:', err);
      }
    });
  }

  onSaveCarreras(): void {
    if (!this.plan || this.selectedCarreras.length === 0) return;

    // Solo tomar el primer ID ya que ahora solo se permite una carrera por plan
    const idCarrera = this.selectedCarreras[0];
    if (!idCarrera || idCarrera <= 0) {
      this.toastService.showError('Error', 'Debe seleccionar una carrera válida.');
      return;
    }

    this.loading = true;
    
    // Si ya existe una carrera, eliminarla primero antes de agregar la nueva
    if (this.planCarreras.length > 0) {
      const carreraActual = this.planCarreras[0];
      
      // Eliminar la carrera actual
      this.planCarreraService.remove(this.plan.id_plan, carreraActual.id_plan_carrera).subscribe({
        next: () => {
          // Después de eliminar, agregar la nueva carrera
          this.planCarreraService.addCarrera(this.plan!.id_plan, idCarrera).subscribe({
            next: (planCarrera) => {
              this.loading = false;
              const carreraNueva = this.availableCarreras.find(c => c.id_carrera === idCarrera);
              const carreraNuevaNombre = carreraNueva?.nombre_carrera || 'la nueva carrera';
              this.toastService.showSuccess('Carrera reemplazada', `La carrera ha sido reemplazada por "${carreraNuevaNombre}".`);
              this.showAddCarreraModal = false;
              this.selectedCarreras = [];
              this.loadPlan();
            },
            error: (err) => {
              this.loading = false;
              const errorMessage = err?.error?.message || err.message || 'No se pudo agregar la nueva carrera.';
              this.toastService.showError('Error', errorMessage);
              console.error('Error adding carrera:', err);
            }
          });
        },
        error: (err) => {
          this.loading = false;
          const errorMessage = err?.error?.message || err.message || 'No se pudo eliminar la carrera actual.';
          this.toastService.showError('Error', errorMessage);
          console.error('Error removing carrera:', err);
        }
      });
    } else {
      // No hay carrera previa, agregar normalmente
      this.planCarreraService.addCarrera(this.plan.id_plan, idCarrera).subscribe({
        next: (planCarrera) => {
          this.loading = false;
          const carreraAgregada = this.availableCarreras.find(c => c.id_carrera === idCarrera);
          const carreraNombre = carreraAgregada?.nombre_carrera || 'la carrera';
          this.toastService.showSuccess('Carrera agregada', `Se agregó "${carreraNombre}" al plan.`);
          this.showAddCarreraModal = false;
          this.selectedCarreras = [];
          this.loadPlan();
        },
        error: (err) => {
          this.loading = false;
          const errorMessage = err?.error?.message || err.message || 'No se pudo agregar la carrera.';
          this.toastService.showError('Error', errorMessage);
          console.error('Error adding carrera:', err);
        }
      });
    }
  }

  onDeleteCarrera(planCarrera: PlanCarrera): void {
    if (!this.plan) return;

    const carreraNombre = planCarrera.carrera?.nombre_carrera || 'esta carrera';

    this.confirmService.confirmDelete(
      () => {
        this.planCarreraService.remove(this.plan!.id_plan, planCarrera.id_plan_carrera).subscribe({
          next: () => {
            this.toastService.showSuccess('Carrera eliminada', `La carrera "${carreraNombre}" se eliminó del plan.`);
            this.loadPlan();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || err.message || 'No se pudo eliminar la carrera.';
            this.toastService.showError('Error', errorMessage);
            console.error('Error deleting carrera:', err);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar la carrera "${carreraNombre}" del plan?`,
      'Confirmar eliminación'
    );
  }

  onAddAsignatura(planCarrera: PlanCarrera): void {
    this.selectedPlanCarrera = planCarrera;
    this.loadingAsignaturas = true;
    
    // Cargar asignaturas de la carrera
    this.asignaturaService.findAll().subscribe({
      next: (asignaturas) => {
        // Filtrar asignaturas que ya están en el plan-carrera
        const existingAsignaturasIds = ((planCarrera as any).asignaturas || []).map((a: PlanCarreraAsignatura) => a.id_asignatura);
        this.availableAsignaturas = asignaturas.filter(a => 
          a.id_carrera === planCarrera.id_carrera && !existingAsignaturasIds.includes(a.id_asignatura)
        );
        this.selectedAsignaturas = [];
        this.showAddAsignaturaModal = true;
        this.loadingAsignaturas = false;
      },
      error: (err) => {
        this.loadingAsignaturas = false;
        this.toastService.showError('Error', 'No se pudieron cargar las asignaturas.');
        console.error('Error loading asignaturas:', err);
      }
    });
  }

  onSaveAsignaturas(): void {
    if (!this.selectedPlanCarrera || !this.plan || this.selectedAsignaturas.length === 0) return;

    this.loading = true;
    this.planCarreraAsignaturaService.addAsignaturas(
      this.plan.id_plan,
      this.selectedPlanCarrera.id_plan_carrera,
      this.selectedAsignaturas
    ).subscribe({
      next: (planCarreraAsignaturas) => {
        this.toastService.showSuccess('Asignaturas agregadas', `Se agregaron ${planCarreraAsignaturas.length} asignaturas.`);
        this.showAddAsignaturaModal = false;
        this.loadAsignaturasForCarrera(this.selectedPlanCarrera!.id_plan_carrera);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err?.error?.message || err.message || 'No se pudieron agregar las asignaturas.';
        this.toastService.showError('Error', errorMessage);
        console.error('Error adding asignaturas:', err);
      }
    });
  }

  onDeleteAsignatura(planCarrera: PlanCarrera, planCarreraAsignatura: PlanCarreraAsignatura): void {
    if (!this.plan) return;
    
    const asignaturaNombre = planCarreraAsignatura.asignatura?.nombre_asignatura || 'esta asignatura';

    this.confirmService.confirmDelete(
      () => {
        this.planCarreraAsignaturaService.remove(
          this.plan!.id_plan,
          planCarrera.id_plan_carrera,
          planCarreraAsignatura.id_plan_carrera_asignatura
        ).subscribe({
          next: () => {
            this.toastService.showSuccess('Asignatura eliminada', `La asignatura "${asignaturaNombre}" se eliminó.`);
            this.loadAsignaturasForCarrera(planCarrera.id_plan_carrera);
          },
          error: (err) => {
            const errorMessage = err?.error?.message || err.message || 'No se pudo eliminar la asignatura.';
            this.toastService.showError('Error', errorMessage);
            console.error('Error deleting asignatura:', err);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar la asignatura "${asignaturaNombre}"?`,
      'Confirmar eliminación'
    );
  }

  toggleCarrera(idPlanCarrera: number): void {
    if (this.expandedCarreras.has(idPlanCarrera)) {
      this.expandedCarreras.delete(idPlanCarrera);
    } else {
      this.expandedCarreras.add(idPlanCarrera);
    }
  }

  isCarreraExpanded(idPlanCarrera: number): boolean {
    return this.expandedCarreras.has(idPlanCarrera);
  }

  getAsignaturasForCarrera(planCarrera: PlanCarrera): PlanCarreraAsignatura[] {
    return (planCarrera as any).asignaturas || [];
  }

  getAnio(): number | undefined {
    return this.plan ? (this.plan as any).año : undefined;
  }

  getFechaInicio(): Date | string | undefined {
    return this.plan?.fecha_inicio;
  }

  getFechaFin(): Date | string | undefined {
    return this.plan?.fecha_fin;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  toggleCarreraSelection(carreraId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selectedCarreras.includes(carreraId)) {
        this.selectedCarreras.push(carreraId);
      }
    } else {
      this.selectedCarreras = this.selectedCarreras.filter(id => id !== carreraId);
    }
  }

  toggleAsignaturaSelection(asignaturaId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selectedAsignaturas.includes(asignaturaId)) {
        this.selectedAsignaturas.push(asignaturaId);
      }
    } else {
      this.selectedAsignaturas = this.selectedAsignaturas.filter(id => id !== asignaturaId);
    }
  }
}

