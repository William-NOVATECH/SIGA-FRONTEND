import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormacionAcademicaService } from '../../services/formacion-academica.service';
import { CreateFormacionAcademicaDto, UpdateFormacionAcademicaDto, FormacionAcademica } from '../../models/formacion-academica.model';
import { StorageService } from '../../../../core/services/storage.service';
import { ToastService } from '../../../../core/services/toast.service';

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
  uploading = false;
  error = '';
  isEditMode = false;
  selectedFile: File | null = null;
  fileName: string = '';
  filePreview: string | null = null;

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
    private formacionAcademicaService: FormacionAcademicaService,
    private storageService: StorageService,
    private toastService: ToastService
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
        console.log('DocenteId del componente:', this.docenteId);
        
        // Obtener el id_docente de la formación (priorizar el anidado según los logs)
        const formacionDocenteId = formacion.docente?.id_docente || formacion.id_docente || formacion.docente?.id;
        
        console.log('id_docente de la formación (anidado):', formacion.docente?.id_docente);
        console.log('id_docente de la formación (directo):', formacion.id_docente);
        console.log('id_docente obtenido:', formacionDocenteId);
        
        // Si la formación tiene un id_docente, usarlo en lugar del que viene como input
        // Esto asegura que siempre usemos el id_docente correcto de la formación
        if (formacionDocenteId) {
          this.docenteId = Number(formacionDocenteId);
          console.log('DocenteId actualizado a:', this.docenteId);
        }
        
        // Limpiar el valor "string" si es un valor literal inválido
        let documentoTitulo = formacion.documento_titulo;
        if (!documentoTitulo || 
            documentoTitulo === 'string' || 
            documentoTitulo === 'null' || 
            documentoTitulo === 'undefined' ||
            (typeof documentoTitulo === 'string' && documentoTitulo.trim() === '')) {
          documentoTitulo = '';
        }

        // Mapear los datos del backend al formulario
        // El backend puede devolver año_graduacion (con tilde) o anio_graduacion (sin tilde)
        const anioGraduacion = (formacion as any).año_graduacion || formacion.anio_graduacion;

        this.formacionForm.patchValue({
          nivel_formacion: formacion.nivel_formacion,
          titulo: formacion.titulo,
          institucion: formacion.institucion,
          anio_graduacion: anioGraduacion,
          pais: formacion.pais,
          documento_titulo: documentoTitulo || ''
        });

        // Si hay un documento_titulo válido (no "string"), mostrar el nombre del archivo
        if (documentoTitulo && 
            documentoTitulo !== 'string' && 
            documentoTitulo.startsWith('http')) {
          const urlParts = documentoTitulo.split('/');
          this.fileName = urlParts[urlParts.length - 1] || 'Documento existente';
          this.filePreview = documentoTitulo;
        } else {
          // Limpiar si el valor es inválido
          this.fileName = '';
          this.filePreview = null;
        }
      },
      error: (err) => {
        console.error('Error cargando formación:', err);
        this.error = 'Error al cargar la formación académica';
        this.toastService.showError('Error al cargar', 'No se pudo cargar la formación académica.');
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

    this.uploading = true;
    this.error = '';

    this.storageService.uploadFile(this.selectedFile, 'documentos').subscribe({
      next: (response) => {
        this.uploading = false;
        // Asignar la URL al campo documento_titulo
        this.formacionForm.patchValue({
          documento_titulo: response.url
        });
        this.toastService.showSuccess('Archivo subido', 'El archivo se ha subido correctamente.');
      },
      error: (err) => {
        this.uploading = false;
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
    this.formacionForm.patchValue({
      documento_titulo: ''
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
    if (this.formacionForm.invalid || !this.docenteId) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    console.log('Enviando formación para docente ID:', this.docenteId);
    
    // Transformar los datos del formulario para que coincidan con el backend
    const formValue = this.formacionForm.value;
    const transformedData = {
      id_docente: this.docenteId,
      nivel_formacion: formValue.nivel_formacion,
      titulo: formValue.titulo,
      institucion: formValue.institucion,
      año_graduacion: formValue.anio_graduacion || null, // Transformar anio_graduacion a año_graduacion
      pais: formValue.pais || null,
      documento_titulo: formValue.documento_titulo || null
    };

    // Eliminar campos vacíos o null
    Object.keys(transformedData).forEach(key => {
      if (transformedData[key as keyof typeof transformedData] === null || 
          transformedData[key as keyof typeof transformedData] === '' ||
          transformedData[key as keyof typeof transformedData] === undefined) {
        delete transformedData[key as keyof typeof transformedData];
      }
    });
    
    if (this.isEditMode && this.formacionId) {
      console.log('Actualizando formación:', transformedData);

      this.formacionAcademicaService.update(this.formacionId, transformedData as any).subscribe({
        next: (response) => {
          console.log('Formación actualizada:', response);
          this.saving = false;
          this.formacionForm.reset();
          this.showForm = false;
          this.isEditMode = false;
          this.formacionId = undefined;
          this.resetFileInput();
          this.toastService.showSuccess('Formación actualizada', 'La formación académica se ha actualizado correctamente.');
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          const errorMessage = err.error?.message || err.message || 'Error al actualizar la formación académica';
          this.error = 'Error al actualizar la formación académica: ' + errorMessage;
          this.toastService.showError('Error al actualizar', errorMessage);
          console.error('Error updating formacion:', err);
        }
      });
    } else {
      console.log('Creando formación:', transformedData);

      this.formacionAcademicaService.create(transformedData as any).subscribe({
        next: (response) => {
          console.log('Formación creada:', response);
          this.saving = false;
          this.formacionForm.reset();
          this.showForm = false;
          this.resetFileInput();
          this.toastService.showSuccess('Formación creada', 'La formación académica se ha creado correctamente.');
          this.saved.emit();
        },
        error: (err) => {
          this.saving = false;
          const errorMessage = err.error?.message || err.message || 'Error al guardar la formación académica';
          this.error = 'Error al guardar la formación académica: ' + errorMessage;
          this.toastService.showError('Error al guardar', errorMessage);
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