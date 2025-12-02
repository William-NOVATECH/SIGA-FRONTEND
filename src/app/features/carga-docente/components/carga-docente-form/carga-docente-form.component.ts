import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CargaDocenteService } from '../../services/carga-docente.service';
import { DocenteService } from '../../services/docente.service';
import { GrupoService } from '../../services/grupo.service';
import { CreateCargaDocente, UpdateCargaDocente } from '../../interfaces/create-carga-docente.interface';
import { CargaDocenteWithRelations } from '../../models/carga-docente.model';
import { VerificationResponse } from '../../interfaces/api-response.interface';
import { Docente, Grupo } from '../../models/carga-docente.model';

@Component({
  selector: 'app-carga-docente-form',
  templateUrl: './carga-docente-form.component.html',
  styleUrls: ['./carga-docente-form.component.css']
})
export class CargaDocenteFormComponent implements OnInit {
  @Input() carga?: CargaDocenteWithRelations;
  @Output() submitForm = new EventEmitter<CreateCargaDocente | UpdateCargaDocente>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  verificationLoading = false;
  verificationResult?: VerificationResponse;

  docentes: Docente[] = [];
  grupos: Grupo[] = [];
  loadingDocentes = false;
  loadingGrupos = false;

  tiposVinculacion = [
    { value: 'titular', label: 'Titular' },
    { value: 'suplente', label: 'Suplente' },
    { value: 'auxiliar', label: 'Auxiliar' },
    { value: 'coordinador', label: 'Coordinador' }
  ];

  estados = [
    { value: 'asignada', label: 'Asignada' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(
    private fb: FormBuilder,
    private cargaDocenteService: CargaDocenteService,
    private docenteService: DocenteService,
    private grupoService: GrupoService
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.loadDocentes();
    this.loadGrupos();
    
    if (this.carga) {
      this.populateForm();
    }
    this.setupFormListeners();
  }

  createForm(): FormGroup {
    return this.fb.group({
      id_docente: [null, [Validators.required]],
      id_grupo: [null, [Validators.required]],
      tipo_vinculacion: ['titular', [Validators.required]],
      estado: ['asignada', [Validators.required]],
      observaciones: ['']
    });
  }

  loadDocentes(): void {
    this.loadingDocentes = true;
    this.docenteService.findAll().subscribe({
      next: (docentes) => {
        this.docentes = docentes;
        this.loadingDocentes = false;
        console.log('Docentes cargados:', this.docentes);
      },
      error: (error) => {
        console.error('Error crítico al cargar docentes:', error);
        this.docentes = [];
        this.loadingDocentes = false;
      }
    });
  }

  loadGrupos(): void {
    this.loadingGrupos = true;
    this.grupoService.findAll().subscribe({
      next: (grupos) => {
        this.grupos = grupos;
        this.loadingGrupos = false;
        console.log('Grupos cargados:', this.grupos);
      },
      error: (error) => {
        console.error('Error crítico al cargar grupos:', error);
        this.grupos = [];
        this.loadingGrupos = false;
      }
    });
  }

  populateForm(): void {
    this.form.patchValue({
      id_docente: this.carga?.id_docente,
      id_grupo: this.carga?.id_grupo,
      tipo_vinculacion: this.carga?.tipo_vinculacion,
      estado: this.carga?.estado,
      observaciones: this.carga?.observaciones || ''
    });
  }

  setupFormListeners(): void {
    this.form.get('id_docente')?.valueChanges.subscribe(() => {
      this.verifyAssignment();
    });

    this.form.get('id_grupo')?.valueChanges.subscribe(() => {
      this.verifyAssignment();
    });
  }

  verifyAssignment(): void {
    const idDocente = this.form.get('id_docente')?.value;
    const idGrupo = this.form.get('id_grupo')?.value;

    if (idDocente && idGrupo) {
      this.verificationLoading = true;
      this.cargaDocenteService.canAssignDocenteToGrupo(idDocente, idGrupo)
        .subscribe({
          next: (result) => {
            this.verificationResult = result;
            this.verificationLoading = false;
          },
          error: () => {
            this.verificationResult = undefined;
            this.verificationLoading = false;
          }
        });
    } else {
      this.verificationResult = undefined;
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      if (!this.carga && (!this.verificationResult || !this.verificationResult.canAssign)) {
        alert('Debe verificar que el docente puede ser asignado al grupo antes de continuar.');
        return;
      }
      
      this.submitForm.emit(this.form.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
    }
    return '';
  }
}