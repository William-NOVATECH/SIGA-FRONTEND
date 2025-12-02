import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { CreateBulkGrupoAsignaturaDocente } from '../models/create-bulk-grupo-asignatura-docente.model';

@Component({
  selector: 'app-grupo-asignatura-docente-bulk-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grupo-asignatura-docente-bulk-form.component.html',
  styleUrls: ['./grupo-asignatura-docente-bulk-form.component.css']
})
export class GrupoAsignaturaDocenteBulkFormComponent {
  @Input() loading: boolean = false;
  @Input() grupos: any[] = [];
  @Input() asignaturas: any[] = [];
  @Input() docentes: any[] = [];
  
  @Output() submitForm = new EventEmitter<CreateBulkGrupoAsignaturaDocente>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  estados = [
    { value: 'activa', label: 'Activa' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      id_grupo: ['', [Validators.required, Validators.min(1)]],
      estado: ['activa', [Validators.required]],
      observaciones: [''],
      asignaturas_docentes: this.fb.array([this.createAsignaturaDocenteItem()])
    });
  }

  // Corrección: Type casting explícito a FormArray
  get asignaturasDocentesArray(): FormArray {
    return this.form.get('asignaturas_docentes') as FormArray;
  }

  private createAsignaturaDocenteItem(): FormGroup {
    return this.fb.group({
      id_asignatura: ['', [Validators.required, Validators.min(1)]],
      id_docente: ['', [Validators.required, Validators.min(1)]]
    });
  }

  addAsignaturaDocente(): void {
    this.asignaturasDocentesArray.push(this.createAsignaturaDocenteItem());
  }

  removeAsignaturaDocente(index: number): void {
    if (this.asignaturasDocentesArray.length > 1) {
      this.asignaturasDocentesArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
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

    // Corrección: Usar el getter que ya hace el type casting
    this.asignaturasDocentesArray.controls.forEach(control => {
      Object.keys((control as FormGroup).controls).forEach(key => {
        const subControl = (control as FormGroup).get(key);
        subControl?.markAsTouched();
      });
    });
  }

  getAsignaturaNombre(id: number): string {
    const asignatura = this.asignaturas.find(a => a.id_asignatura === id);
    return asignatura ? asignatura.nombre_asignatura : 'Seleccionar asignatura';
  }

getDocenteNombre(id: number): string {
  const docente = this.docentes.find(d => d.id_docente === id);
  return docente ? `${docente.nombres} ${docente.apellidos}` : 'Seleccionar docente';
}
}