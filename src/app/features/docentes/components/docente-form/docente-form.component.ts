import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocenteService } from '../../services/docente.service';
import { CargoDocenteService } from '../../services/cargo-docente.service';
import { DepartamentoService } from '../../services/departamento.service';
import { Docente, CreateDocenteDto, UpdateDocenteDto } from '../../models/docente.model';
import { CargoDocente } from '../../models/cargo-docente.model';
import { ToastService } from '../../../../core/services/toast.service';

interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
  codigo_departamento: string;
  estado: string;
}

@Component({
  selector: 'app-docente-form',
  templateUrl: './docente-form.component.html',
  styleUrls: ['./docente-form.component.css']
})
export class DocenteFormComponent implements OnInit {
  @Input() docenteId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  docenteForm: FormGroup;
  loading = false;
  saving = false;
  error = '';

  cargos: CargoDocente[] = [];
  departamentos: Departamento[] = [];

  constructor(
    private fb: FormBuilder,
    private docenteService: DocenteService,
    private cargoDocenteService: CargoDocenteService,
    private departamentoService: DepartamentoService,
    private toastService: ToastService
  ) {
    this.docenteForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('DocenteFormComponent iniciado, docenteId:', this.docenteId);
    this.loadCargos();
    this.loadDepartamentos();
    
    if (this.docenteId) {
      this.loadDocente();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      id_departamento: ['', [Validators.required]],
      id_cargo: ['', [Validators.required]],
      codigo_docente: ['', [Validators.required, Validators.maxLength(20)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      identificacion: ['', [Validators.required, Validators.maxLength(20)]],
      fecha_nacimiento: [''],
      genero: [''],
      estado: ['activo'],
      fecha_ingreso: ['']
    });
  }

  loadCargos(): void {
    console.log('Cargando cargos...');
    this.cargoDocenteService.findAll().subscribe({
      next: (response: any) => {
        let cargosRaw: any[] = [];
        
        if (Array.isArray(response)) {
          cargosRaw = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          cargosRaw = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          cargosRaw = [];
        }

        this.cargos = cargosRaw;
      },
      error: (err) => {
        console.error('Error cargando cargos:', err);
        const errorMessage = err?.error?.message || 'No se pudieron cargar los cargos. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar cargos', errorMessage);
      }
    });
  }

  loadDepartamentos(): void {
    console.log('Cargando departamentos...');
    this.departamentoService.findAll().subscribe({
      next: (response: any) => {
        console.log('Respuesta de departamentos:', response);
        
        if (Array.isArray(response)) {
          this.departamentos = response;
        } else if (response?.data && Array.isArray(response.data)) {
          this.departamentos = response.data;
        } else {
          console.error('Estructura de respuesta no reconocida:', response);
          this.toastService.showError('Error al cargar departamentos', 'Estructura de datos no reconocida');
          return;
        }
        
        console.log('Departamentos procesados:', this.departamentos);
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
        const errorMessage = err?.error?.message || 'No se pudieron cargar los departamentos. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar departamentos', errorMessage);
      }
    });
  }

  loadDocente(): void {
    if (!this.docenteId) return;

    this.loading = true;
    this.docenteService.findOne(this.docenteId).subscribe({
      next: (response: any) => {
        // Manejar diferentes formatos de respuesta
        let docente: any;
        if (response && typeof response === 'object') {
          if (response.data) {
            docente = response.data;
          } else {
            docente = response;
          }
        } else {
          docente = response;
        }

        console.log('Docente cargado:', docente);
        
        // Asegurar que los IDs sean números
        const id_departamento = Number(docente.id_departamento || docente.departamento?.id_departamento);
        const id_cargo = Number(docente.id_cargo || docente.cargo?.id_cargo);
        
        this.docenteForm.patchValue({
          id_departamento: id_departamento || '',
          id_cargo: id_cargo || '',
          codigo_docente: docente.codigo_docente || '',
          nombres: docente.nombres || '',
          apellidos: docente.apellidos || '',
          identificacion: docente.identificacion || '',
          fecha_nacimiento: docente.fecha_nacimiento || '',
          genero: docente.genero || '',
          estado: docente.estado || 'activo',
          fecha_ingreso: docente.fecha_ingreso || ''
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading docente:', err);
        const errorMessage = err?.error?.message || 'No se pudo cargar el docente. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar docente', errorMessage);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.docenteForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.showWarn(
        'Formulario inválido',
        'Por favor, complete todos los campos requeridos.'
      );
      return;
    }

    this.saving = true;
    const formValue = this.docenteForm.value;

    // CONVERTIR LOS IDs A NÚMEROS
    const processedData = {
      ...formValue,
      id_departamento: Number(formValue.id_departamento),
      id_cargo: Number(formValue.id_cargo)
    };

    console.log('Enviando datos:', processedData);

    if (this.docenteId) {
      // Actualizar
      const updateDto: UpdateDocenteDto = processedData;
      this.docenteService.update(this.docenteId, updateDto).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.showSuccess(
            'Docente actualizado',
            'El docente se ha actualizado correctamente.'
          );
          this.saved.emit();
        },
        error: (err) => {
          this.handleError(err, 'actualizar');
        }
      });
    } else {
      // Crear
      const createDto: CreateDocenteDto = processedData;
      this.docenteService.create(createDto).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.showSuccess(
            'Docente creado',
            'El docente se ha creado correctamente.'
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
    
    let errorMessage = `No se pudo ${action} el docente. Por favor, intente nuevamente.`;
    
    if (err.status === 400) {
      if (err.error?.message?.includes('código')) {
        errorMessage = 'El código de docente ya está registrado';
      } else if (err.error?.message?.includes('identificación')) {
        errorMessage = 'La identificación ya está registrada';
      } else {
        errorMessage = err.error?.message || `Error de validación al ${action} el docente`;
      }
    } else if (err.status === 404) {
      errorMessage = 'Departamento o cargo no encontrado';
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    }
    
    this.toastService.showError(`Error al ${action}`, errorMessage);
    console.error(`Error ${action} docente:`, err);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.docenteForm.controls).forEach(key => {
      const control = this.docenteForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Getters para fácil acceso en el template
  get f() { return this.docenteForm.controls; }
}
