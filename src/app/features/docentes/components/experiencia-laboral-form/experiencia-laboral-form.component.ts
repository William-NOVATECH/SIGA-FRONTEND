import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExperienciaLaboralService } from '../../services/experiencia-laboral.service';
import { CreateExperienciaLaboralDto, UpdateExperienciaLaboralDto, ExperienciaLaboral } from '../../models/experiencia-laboral.model';
import { StorageService } from '../../../../core/services/storage.service';
import { ToastService } from '../../../../core/services/toast.service';

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

  // File upload properties
  selectedFile: File | null = null;
  fileName: string = '';
  filePreview: string | ArrayBuffer | null = null;
  uploadingFile = false;

  constructor(
    private fb: FormBuilder,
    private experienciaLaboralService: ExperienciaLaboralService,
    private storageService: StorageService,
    private toastService: ToastService
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
      descripcion_funciones: [''],
      documento_url: [''] // This will store the URL
    });
  }

  loadExperiencia(): void {
    if (!this.experienciaId) return;

    this.experienciaLaboralService.findOne(this.experienciaId).subscribe({
      next: (experiencia) => {
        console.log('Experiencia cargada para edición:', experiencia);
        console.log('DocenteId del componente:', this.docenteId);
        
        // Obtener el id_docente de la experiencia (puede venir directamente o anidado)
        const experienciaDocenteId = experiencia.id_docente || experiencia.docente?.id_docente || experiencia.docente?.id;
        
        // Usar el id_docente de la experiencia si está presente, de lo contrario usar el del input
        const actualDocenteId = experienciaDocenteId ? Number(experienciaDocenteId) : this.docenteId;

        // Limpiar el valor "string" si viene del backend
        const documentoUrl = (experiencia.documento_url === 'string' || !experiencia.documento_url) 
                          ? '' 
                          : experiencia.documento_url;

        const fechaInicio = this.formatDateForInput(experiencia.fecha_inicio);
        const fechaFin = experiencia.fecha_fin ? this.formatDateForInput(experiencia.fecha_fin) : '';

        this.experienciaForm.patchValue({
          cargo_ejercido: experiencia.cargo_ejercido,
          institucion_empresa: experiencia.institucion_empresa,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          descripcion_funciones: experiencia.descripcion_funciones,
          documento_url: documentoUrl
        });

        // Si hay un documento válido (no "string"), mostrar el nombre del archivo
        if (documentoUrl && documentoUrl.startsWith('http')) {
          const urlParts = documentoUrl.split('/');
          this.fileName = urlParts[urlParts.length - 1] || 'Documento existente';
          this.filePreview = documentoUrl;
        } else {
          this.fileName = '';
          this.filePreview = null;
        }
      },
      error: (err) => {
        console.error('Error cargando experiencia:', err);
        this.error = 'Error al cargar la experiencia laboral';
        this.toastService.showError('Error al cargar', 'No se pudo cargar la experiencia laboral.');
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
      this.resetFileInput();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.toastService.showError('Tipo de archivo no válido', 'Solo se permiten archivos PDF, imágenes (JPG, PNG, GIF) o documentos Word.');
        input.value = '';
        return;
      }

      // Validar tamaño (máx 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (file.size > maxSize) {
        this.toastService.showError('Archivo muy grande', 'El archivo no puede exceder los 10MB.');
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.fileName = file.name;

      // Si es una imagen, crear preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreview = null;
      }

      // Subir archivo automáticamente
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.uploadingFile = true;
    this.error = '';

    this.storageService.uploadFile(this.selectedFile, 'documentos').subscribe({
      next: (response) => {
        this.uploadingFile = false;
        // Asignar la URL al campo documento_url
        this.experienciaForm.patchValue({
          documento_url: response.url
        });
        this.toastService.showSuccess('Archivo subido', 'El archivo se ha subido correctamente.');
      },
      error: (err) => {
        this.uploadingFile = false;
        const errorMessage = err.error?.message || err.message || 'Error al subir el archivo';
        this.toastService.showError('Error al subir archivo', errorMessage);
        this.error = errorMessage;
        this.selectedFile = null;
        this.fileName = '';
        this.filePreview = null;
      }
    });
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.filePreview = null;
    this.experienciaForm.patchValue({
      documento_url: ''
    });
    // Resetear el input file
    const fileInput = document.getElementById('documento_file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  resetFileInput(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.filePreview = null;
    const fileInput = document.getElementById('documento_file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.experienciaForm.invalid || !this.docenteId) {
      this.markFormGroupTouched();
      this.toastService.showWarn('Formulario inválido', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    this.saving = true;
    this.error = '';

    const formValue = this.experienciaForm.value;
    const processedData: any = {
      id_docente: this.docenteId, // Asegurar que se envíe el ID correcto
      cargo_ejercido: formValue.cargo_ejercido,
      institucion_empresa: formValue.institucion_empresa,
      fecha_inicio: formValue.fecha_inicio,
      descripcion_funciones: formValue.descripcion_funciones
    };

    // Agregar fecha_fin solo si tiene valor
    if (formValue.fecha_fin) {
      processedData.fecha_fin = formValue.fecha_fin;
    }

    // Agregar documento_url solo si tiene valor
    if (formValue.documento_url) {
      processedData.documento_url = formValue.documento_url;
    }

    // Eliminar campos nulos o vacíos para evitar errores del backend
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === null || processedData[key] === undefined || processedData[key] === '') {
        delete processedData[key];
      }
    });

    console.log('Enviando experiencia procesada:', processedData);
    
    if (this.isEditMode && this.experienciaId) {
      const updateDto: UpdateExperienciaLaboralDto = processedData;

      this.experienciaLaboralService.update(this.experienciaId, updateDto).subscribe({
        next: (response) => {
          this.toastService.showSuccess('Experiencia actualizada', 'La experiencia laboral se ha actualizado correctamente.');
          this.saving = false;
          this.experienciaForm.reset();
          this.showForm = false;
          this.isEditMode = false;
          this.experienciaId = undefined;
          this.resetFileInput();
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al actualizar la experiencia laboral: ' + (err.error?.message || err.message);
          this.toastService.showError('Error al actualizar', this.error);
          console.error('Error updating experiencia:', err);
        }
      });
    } else {
      const createDto: CreateExperienciaLaboralDto = processedData;

      this.experienciaLaboralService.create(createDto).subscribe({
        next: (response) => {
          this.toastService.showSuccess('Experiencia creada', 'La experiencia laboral se ha creado correctamente.');
          this.saving = false;
          this.experienciaForm.reset();
          this.showForm = false;
          this.resetFileInput();
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al guardar la experiencia laboral: ' + (err.error?.message || err.message);
          this.toastService.showError('Error al guardar', this.error);
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
    this.resetFileInput();
    this.cancel.emit();
  }

  get f() { return this.experienciaForm.controls; }
}