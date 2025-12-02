import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormacionAcademicaService } from '../../services/formacion-academica.service';
import { CreateFormacionAcademicaDto, UpdateFormacionAcademicaDto, FormacionAcademica } from '../../models/formacion-academica.model';

@Component({
  selector: 'app-formacion-academica-form',
  templateUrl: './formacion-academica-form.component.html',
  styleUrls: ['./formacion-academica-form.component.css']
})
export class FormacionAcademicaFormComponent implements OnInit {
  @Input() docenteId!: number;
  @Input() formacionId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  formacionForm: FormGroup;
  showForm = false;
  saving = false;
  error = '';
  isEditMode = false;

  currentYear = new Date().getFullYear();

  nivelesFormacion = [
    'Pregrado',
    'Especialización',
    'Maestría',
    'Doctorado',
    'Postdoctorado',
    'Diplomado',
    'Certificación'
  ];

  constructor(
    private fb: FormBuilder,
    private formacionAcademicaService: FormacionAcademicaService
  ) {
    this.formacionForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.formacionId) {
      this.isEditMode = true;
      this.showForm = true;
      this.loadFormacion();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      nivel_formacion: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      institucion: ['', [Validators.required, Validators.maxLength(200)]],
      anio_graduacion: ['', [Validators.min(1900), Validators.max(this.currentYear)]],
      pais: ['', Validators.maxLength(100)],
      documento_titulo: ['']
    });
  }

  loadFormacion(): void {
    if (!this.formacionId) return;

    this.formacionAcademicaService.findOne(this.formacionId).subscribe({
      next: (formacion) => {
        console.log('Formación cargada para edición:', formacion);
        // Verificar que la formación pertenece al docente correcto
        if (formacion.id_docente !== this.docenteId) {
          this.error = 'Error: Esta formación no pertenece al docente actual';
          return;
        }

        this.formacionForm.patchValue({
          nivel_formacion: formacion.nivel_formacion,
          titulo: formacion.titulo,
          institucion: formacion.institucion,
          anio_graduacion: formacion.anio_graduacion,
          pais: formacion.pais,
          documento_titulo: formacion.documento_titulo
        });
      },
      error: (err) => {
        console.error('Error cargando formación:', err);
        this.error = 'Error al cargar la formación académica';
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.formacionForm.reset();
      this.error = '';
      this.isEditMode = false;
      this.formacionId = undefined;
    }
  }

  onSubmit(): void {
    if (this.formacionForm.invalid || !this.docenteId) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    console.log('Enviando formación para docente ID:', this.docenteId);
    
    if (this.isEditMode && this.formacionId) {
      const updateDto: UpdateFormacionAcademicaDto = {
        ...this.formacionForm.value,
        id_docente: this.docenteId // ← Asegurar que se envíe el ID correcto
      };

      console.log('Actualizando formación:', updateDto);

      this.formacionAcademicaService.update(this.formacionId, updateDto).subscribe({
        next: (response) => {
          console.log('Formación actualizada:', response);
          this.saving = false;
          this.formacionForm.reset();
          this.showForm = false;
          this.isEditMode = false;
          this.formacionId = undefined;
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al actualizar la formación académica: ' + (err.error?.message || err.message);
          console.error('Error updating formacion:', err);
        }
      });
    } else {
      const createDto: CreateFormacionAcademicaDto = {
        ...this.formacionForm.value,
        id_docente: this.docenteId // ← Asegurar que se envíe el ID correcto
      };

      console.log('Creando formación:', createDto);

      this.formacionAcademicaService.create(createDto).subscribe({
        next: (response) => {
          console.log('Formación creada:', response);
          this.saving = false;
          this.formacionForm.reset();
          this.showForm = false;
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al guardar la formación académica: ' + (err.error?.message || err.message);
          console.error('Error saving formacion:', err);
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.formacionForm.controls).forEach(key => {
      const control = this.formacionForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.showForm = false;
    this.formacionForm.reset();
    this.error = '';
    this.isEditMode = false;
    this.formacionId = undefined;
    this.cancel.emit();
  }

  get f() { return this.formacionForm.controls; }
}