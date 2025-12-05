import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CargoDocenteService } from '../../services/cargo-docente.service';
import { CargoDocente, CreateCargoDocenteDto, UpdateCargoDocenteDto } from '../../models/cargo-docente.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-cargo-docente-form',
  templateUrl: './cargo-docente-form.component.html',
  styleUrls: ['./docente-form.component.css']
})
export class CargoDocenteFormComponent implements OnInit {
  @Input() cargoId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  cargoForm: FormGroup;
  loading = false;
  saving = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private cargoDocenteService: CargoDocenteService,
    private toastService: ToastService
  ) {
    this.cargoForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.cargoId) {
      this.loadCargo();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre_cargo: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: [''],
      max_asignaturas: ['', [Validators.required, Validators.min(1)]],
      min_asignaturas: ['', [Validators.min(0)]],
      estado: ['activo']
    });
  }

  loadCargo(): void {
    if (!this.cargoId) return;

    this.loading = true;
    this.cargoDocenteService.findOne(this.cargoId).subscribe({
      next: (response: any) => {
        // Manejar diferentes formatos de respuesta
        let cargo: any;
        if (response && typeof response === 'object') {
          if (response.data) {
            cargo = response.data;
          } else {
            cargo = response;
          }
        } else {
          cargo = response;
        }

        console.log('Cargo cargado:', cargo);
        this.cargoForm.patchValue({
          nombre_cargo: cargo.nombre_cargo || '',
          descripcion: cargo.descripcion || '',
          max_asignaturas: cargo.max_asignaturas || '',
          min_asignaturas: cargo.min_asignaturas || '',
          estado: cargo.estado || 'activo'
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cargo:', err);
        const errorMessage = err?.error?.message || 'No se pudo cargar el cargo docente. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar cargo', errorMessage);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.cargoForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.showWarn(
        'Formulario inválido',
        'Por favor, complete todos los campos requeridos.'
      );
      return;
    }

    this.saving = true;
    const formValue = this.cargoForm.value;

    // CONVERTIR LOS NÚMEROS
    const processedData = {
      ...formValue,
      max_asignaturas: Number(formValue.max_asignaturas),
      min_asignaturas: formValue.min_asignaturas ? Number(formValue.min_asignaturas) : 0
    };

    console.log('Enviando datos de cargo:', processedData);

    if (this.cargoId) {
      // Actualizar
      const updateDto: UpdateCargoDocenteDto = processedData;
      this.cargoDocenteService.update(this.cargoId, updateDto).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.showSuccess(
            'Cargo actualizado',
            'El cargo docente se ha actualizado correctamente.'
          );
          this.saved.emit();
        },
        error: (err) => {
          this.handleError(err, 'actualizar');
        }
      });
    } else {
      // Crear
      const createDto: CreateCargoDocenteDto = processedData;
      this.cargoDocenteService.create(createDto).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.showSuccess(
            'Cargo creado',
            'El cargo docente se ha creado correctamente.'
          );
          this.saved.emit();
        },
        error: (err) => {
          this.handleError(err, 'crear');
        }
      });
    }
  }

  private handleError(err: any, action: string): void {
    this.saving = false;
    
    let errorMessage = `No se pudo ${action} el cargo docente. Por favor, intente nuevamente.`;
    
    if (err.status === 400) {
      if (err.error?.message?.includes('nombre')) {
        errorMessage = 'El nombre del cargo ya está registrado';
      } else {
        errorMessage = err.error?.message || `Error de validación al ${action} el cargo`;
      }
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    }
    
    this.toastService.showError(`Error al ${action}`, errorMessage);
    console.error(`Error ${action} cargo:`, err);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.cargoForm.controls).forEach(key => {
      const control = this.cargoForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Getters para fácil acceso en el template
  get f() { return this.cargoForm.controls; }
}
