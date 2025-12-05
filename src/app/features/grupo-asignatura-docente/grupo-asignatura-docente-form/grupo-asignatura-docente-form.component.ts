import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateGrupoAsignaturaDocente } from '../models/create-grupo-asignatura-docente.model';
import { GrupoAsignaturaDocente } from '../models/grupo-asignatura-docente.model';

@Component({
  selector: 'app-grupo-asignatura-docente-form',
  standalone: false,
  templateUrl: './grupo-asignatura-docente-form.component.html',
  styleUrls: ['./grupo-asignatura-docente-form.component.css']
})
export class GrupoAsignaturaDocenteFormComponent implements OnInit {
  @Input() asignacion?: GrupoAsignaturaDocente;
  @Input() loading: boolean = false;
  @Input() grupos: any[] = [];
  @Input() asignaturas: any[] = [];
  @Input() docentes: any[] = [];
  
  @Output() submitForm = new EventEmitter<CreateGrupoAsignaturaDocente>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEdit: boolean = false;

  estados = [
    { value: 'activa', label: 'Activa' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.isEdit = !!this.asignacion;
    
    if (this.asignacion) {
      this.form.patchValue({
        id_grupo: this.asignacion.id_grupo,
        id_asignatura: this.asignacion.id_asignatura,
        id_docente: this.asignacion.id_docente,
        estado: this.asignacion.estado,
        observaciones: this.asignacion.observaciones || ''
      });

      if (this.isEdit) {
        this.form.get('id_grupo')?.disable();
        this.form.get('id_asignatura')?.disable();
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      id_grupo: ['', [Validators.required, Validators.min(1)]],
      id_asignatura: ['', [Validators.required, Validators.min(1)]],
      id_docente: ['', [Validators.required, Validators.min(1)]],
      estado: ['activa', [Validators.required]],
      observaciones: ['']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue(); // Para obtener valores de controles deshabilitados
      this.submitForm.emit(formValue);
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

  getGrupoNombre(id: number): string {
    const grupo = this.grupos.find(g => g.id_grupo === id);
    return grupo ? grupo.codigo_grupo : 'N/A';
  }

  getAsignaturaNombre(id: number): string {
    const asignatura = this.asignaturas.find(a => a.id_asignatura === id);
    return asignatura ? asignatura.nombre_asignatura : 'N/A';
  }

getDocenteNombre(id: number): string {
  const docente = this.docentes.find(d => d.id_docente === id);
  return docente ? `${docente.nombres} ${docente.apellidos}` : 'Seleccionar docente';
}
}