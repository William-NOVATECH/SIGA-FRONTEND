import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExperienciaLaboralService } from '../../services/experiencia-laboral.service';
import { CreateExperienciaLaboralDto, UpdateExperienciaLaboralDto, ExperienciaLaboral } from '../../models/experiencia-laboral.model';

@Component({
  selector: 'app-experiencia-laboral-form',
  templateUrl: './experiencia-laboral-form.component.html',
  styleUrls: ['./experiencia-laboral-form.component.css']
})
export class ExperienciaLaboralFormComponent implements OnInit {
  @Input() docenteId!: number;
  @Input() experienciaId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  experienciaForm: FormGroup;
  showForm = false;
  saving = false;
  error = '';
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private experienciaLaboralService: ExperienciaLaboralService
  ) {
    this.experienciaForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.experienciaId) {
      this.isEditMode = true;
      this.showForm = true;
      this.loadExperiencia();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      cargo_ejercido: ['', [Validators.required, Validators.maxLength(150)]],
      institucion_empresa: ['', [Validators.required, Validators.maxLength(200)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: [''],
      descripcion_funciones: ['']
    });
  }

  loadExperiencia(): void {
    if (!this.experienciaId) return;

    this.experienciaLaboralService.findOne(this.experienciaId).subscribe({
      next: (experiencia) => {
        console.log('Experiencia cargada para edición:', experiencia);
        // Verificar que la experiencia pertenece al docente correcto
        if (experiencia.id_docente !== this.docenteId) {
          this.error = 'Error: Esta experiencia no pertenece al docente actual';
          return;
        }

        const fechaInicio = this.formatDateForInput(experiencia.fecha_inicio);
        const fechaFin = experiencia.fecha_fin ? this.formatDateForInput(experiencia.fecha_fin) : '';

        this.experienciaForm.patchValue({
          cargo_ejercido: experiencia.cargo_ejercido,
          institucion_empresa: experiencia.institucion_empresa,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          descripcion_funciones: experiencia.descripcion_funciones
        });
      },
      error: (err) => {
        console.error('Error cargando experiencia:', err);
        this.error = 'Error al cargar la experiencia laboral';
      }
    });
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.experienciaForm.reset();
      this.error = '';
      this.isEditMode = false;
      this.experienciaId = undefined;
    }
  }

  onSubmit(): void {
    if (this.experienciaForm.invalid || !this.docenteId) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    console.log('Enviando experiencia para docente ID:', this.docenteId);
    
    if (this.isEditMode && this.experienciaId) {
      const updateDto: UpdateExperienciaLaboralDto = {
        ...this.experienciaForm.value,
        id_docente: this.docenteId // ← Asegurar que se envíe el ID correcto
      };

      console.log('Actualizando experiencia:', updateDto);

      this.experienciaLaboralService.update(this.experienciaId, updateDto).subscribe({
        next: (response) => {
          console.log('Experiencia actualizada:', response);
          this.saving = false;
          this.experienciaForm.reset();
          this.showForm = false;
          this.isEditMode = false;
          this.experienciaId = undefined;
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al actualizar la experiencia laboral: ' + (err.error?.message || err.message);
          console.error('Error updating experiencia:', err);
        }
      });
    } else {
      const createDto: CreateExperienciaLaboralDto = {
        ...this.experienciaForm.value,
        id_docente: this.docenteId // ← Asegurar que se envíe el ID correcto
      };

      console.log('Creando experiencia:', createDto);

      this.experienciaLaboralService.create(createDto).subscribe({
        next: (response) => {
          console.log('Experiencia creada:', response);
          this.saving = false;
          this.experienciaForm.reset();
          this.showForm = false;
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al guardar la experiencia laboral: ' + (err.error?.message || err.message);
          console.error('Error saving experiencia:', err);
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.experienciaForm.controls).forEach(key => {
      const control = this.experienciaForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.showForm = false;
    this.experienciaForm.reset();
    this.error = '';
    this.isEditMode = false;
    this.experienciaId = undefined;
    this.cancel.emit();
  }

  get f() { return this.experienciaForm.controls; }
}