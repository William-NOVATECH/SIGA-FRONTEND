import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlanService } from '../../services/plan.service';
import { Plan, CreatePlanDto, UpdatePlanDto } from '../../models/plan.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-plan-form',
  templateUrl: './plan-form.component.html',
  styleUrls: ['./plan-form.component.css']
})
export class PlanFormComponent implements OnInit {
  @Input() planId?: number;
  @Output() saved = new EventEmitter<Plan>();
  @Output() cancel = new EventEmitter<void>();

  planForm: FormGroup;
  loading = false;
  error = '';
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private planService: PlanService,
    private toastService: ToastService
  ) {
    this.planForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.planId) {
      this.isEditMode = true;
      this.loadPlan();
    }
  }

  createForm(): FormGroup {
    const currentYear = new Date().getFullYear();
    return this.fb.group({
      nombre_plan: ['', [Validators.required, Validators.maxLength(200)]],
      codigo_plan: ['', [Validators.required, Validators.maxLength(20)]],
      año: ['', [Validators.min(1900), Validators.max(currentYear + 10)]],
      fecha_inicio: [''],
      fecha_fin: [''],
      descripcion: ['', Validators.maxLength(500)],
      estado: ['activo']
    });
  }

  loadPlan(): void {
    if (!this.planId) return;

    this.loading = true;
    this.planService.findOne(this.planId).subscribe({
      next: (plan) => {
        const fechaInicio = plan.fecha_inicio ? this.formatDateForInput(plan.fecha_inicio) : '';
        const fechaFin = plan.fecha_fin ? this.formatDateForInput(plan.fecha_fin) : '';
        
        this.planForm.patchValue({
          nombre_plan: plan.nombre_plan,
          codigo_plan: plan.codigo_plan || '',
          año: plan.año || '',
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          descripcion: plan.descripcion || '',
          estado: plan.estado || 'activo'
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el plan';
        this.loading = false;
        this.toastService.showError('Error', 'No se pudo cargar el plan.');
        console.error('Error loading plan:', err);
      }
    });
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.showWarn('Formulario inválido', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.planForm.value;
    const processedData: any = {
      nombre_plan: formValue.nombre_plan,
      codigo_plan: formValue.codigo_plan,
      descripcion: formValue.descripcion,
      estado: formValue.estado
    };

    if (formValue.año) {
      processedData.año = Number(formValue.año);
    }

    if (formValue.fecha_inicio) {
      processedData.fecha_inicio = formValue.fecha_inicio;
    }

    if (formValue.fecha_fin) {
      processedData.fecha_fin = formValue.fecha_fin;
    }

    if (this.isEditMode && this.planId) {
      const updateDto: UpdatePlanDto = processedData;
      this.planService.update(this.planId, updateDto).subscribe({
        next: (plan) => {
          this.toastService.showSuccess('Plan actualizado', 'El plan se ha actualizado correctamente.');
          this.loading = false;
          this.saved.emit(plan);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al actualizar el plan: ' + (err.error?.message || err.message);
          this.toastService.showError('Error al actualizar', this.error);
          console.error('Error updating plan:', err);
        }
      });
    } else {
      const createDto: CreatePlanDto = processedData;
      this.planService.create(createDto).subscribe({
        next: (plan) => {
          this.toastService.showSuccess('Plan creado', 'El plan se ha creado correctamente.');
          this.loading = false;
          this.saved.emit(plan);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al crear el plan: ' + (err.error?.message || err.message);
          this.toastService.showError('Error al crear', this.error);
          console.error('Error creating plan:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.planForm.controls).forEach(key => {
      const control = this.planForm.get(key);
      control?.markAsTouched();
    });
  }

  get f() {
    return this.planForm.controls;
  }
}

