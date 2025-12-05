import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartamentoService } from '../../services/departamento.service';
import { CreateDepartamento, UpdateDepartamento } from '../../models/departamento.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-departamento-form',
  standalone: false,
  templateUrl: './departamento-form.component.html',
  styleUrls: ['./departamento-form.component.css']
})
export class DepartamentoFormComponent implements OnInit {
  departamentoForm: FormGroup;
  isEdit = false;
  loading = false;
  departamentoId?: number;

  constructor(
    private fb: FormBuilder,
    private departamentoService: DepartamentoService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.departamentoForm = this.fb.group({
      nombre_departamento: ['', [Validators.required, Validators.maxLength(100)]],
      codigo_departamento: ['', [Validators.required, Validators.maxLength(10)]],
      estado: ['activo']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.departamentoId = +params['id'];
        this.loadDepartamento();
      }
    });
  }

  loadDepartamento() {
    if (this.departamentoId) {
      this.loading = true;
      this.departamentoService.findOne(this.departamentoId).subscribe({
        next: (departamento) => {
          this.departamentoForm.patchValue(departamento);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading departamento:', error);
          this.loading = false;
          this.toastService.showError(
            'Error al cargar',
            'No se pudo cargar la información del departamento. Por favor, intente nuevamente.'
          );
        }
      });
    }
  }

  onSubmit() {
    if (this.departamentoForm.valid) {
      this.loading = true;
      const formValue = this.departamentoForm.value;

      if (this.isEdit && this.departamentoId) {
        const updateData: UpdateDepartamento = { ...formValue };
        this.departamentoService.update(this.departamentoId, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.toastService.showSuccess(
              'Departamento actualizado',
              'El departamento se ha actualizado correctamente.'
            );
            this.router.navigate(['/departamentos']);
          },
          error: (error) => {
            console.error('Error updating departamento:', error);
            this.loading = false;
            const errorMessage = error?.error?.message || 'No se pudo actualizar el departamento. Por favor, intente nuevamente.';
            this.toastService.showError(
              'Error al actualizar',
              errorMessage
            );
          }
        });
      } else {
        const createData: CreateDepartamento = { ...formValue };
        this.departamentoService.create(createData).subscribe({
          next: () => {
            this.loading = false;
            this.toastService.showSuccess(
              'Departamento creado',
              'El departamento se ha creado correctamente.'
            );
            this.router.navigate(['/departamentos']);
          },
          error: (error) => {
            console.error('Error creating departamento:', error);
            this.loading = false;
            const errorMessage = error?.error?.message || 'No se pudo crear el departamento. Por favor, intente nuevamente.';
            this.toastService.showError(
              'Error al crear',
              errorMessage
            );
          }
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/departamentos']);
  }

  get nombre_departamento() {
    return this.departamentoForm.get('nombre_departamento');
  }

  get codigo_departamento() {
    return this.departamentoForm.get('codigo_departamento');
  }
}