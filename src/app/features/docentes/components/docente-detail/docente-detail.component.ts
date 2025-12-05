import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { DocenteService } from '../../services/docente.service';
import { FormacionAcademicaService } from '../../services/formacion-academica.service';
import { ExperienciaLaboralService } from '../../services/experiencia-laboral.service';
import { Docente } from '../../models/docente.model';
import { FormacionAcademica } from '../../models/formacion-academica.model';
import { ExperienciaLaboral } from '../../models/experiencia-laboral.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-docente-detail',
  templateUrl: './docente-detail.component.html',
  styleUrls: ['./docente-detail.component.css']
})
export class DocenteDetailComponent implements OnInit, OnChanges {
  @Input() docenteId?: number;
  @Output() edit = new EventEmitter<number>();

  docente: Docente | null = null;
  formaciones: FormacionAcademica[] = [];
  experiencias: ExperienciaLaboral[] = [];
  loading = false;
  error = '';
  activeTab: 'info' | 'formacion' | 'experiencia' = 'info';

  // Propiedades para edición
  editingFormacionId?: number;
  editingExperienciaId?: number;

  constructor(
    private docenteService: DocenteService,
    private formacionAcademicaService: FormacionAcademicaService,
    private experienciaLaboralService: ExperienciaLaboralService,
    private confirmService: ConfirmService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    console.log('DocenteDetailComponent iniciado, docenteId:', this.docenteId);
    if (this.docenteId) {
      this.loadDocente();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Cambios en docenteId:', changes);
    if (changes['docenteId'] && changes['docenteId'].currentValue) {
      this.loadDocente();
    } else {
      this.docente = null;
      this.formaciones = [];
      this.experiencias = [];
      this.loading = false;
      this.error = '';
    }
  }

  loadDocente(): void {
    if (!this.docenteId) return;
    
    this.loading = true;
    this.error = '';
    console.log('Cargando docente con ID:', this.docenteId);
    
    this.docenteService.findOne(this.docenteId).subscribe({
      next: (docente) => {
        console.log('Docente cargado:', docente);
        this.docente = docente;
        this.loadFormaciones();
        this.loadExperiencias();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando docente:', err);
        this.error = 'Error al cargar los datos del docente';
        this.loading = false;
      }
    });
  }

  loadFormaciones(): void {
    if (!this.docenteId) return;
    
    console.log('Cargando formaciones para docente ID:', this.docenteId);
    this.formacionAcademicaService.findAll(this.docenteId).subscribe({
      next: (formaciones) => {
        console.log('Formaciones cargadas:', formaciones);
        this.formaciones = formaciones;
      },
      error: (err) => {
        console.error('Error cargando formaciones:', err);
      }
    });
  }

  loadExperiencias(): void {
    if (!this.docenteId) return;
    
    console.log('Cargando experiencias para docente ID:', this.docenteId);
    this.experienciaLaboralService.findAll(this.docenteId).subscribe({
      next: (experiencias) => {
        console.log('Experiencias cargadas:', experiencias);
        this.experiencias = experiencias;
      },
      error: (err) => {
        console.error('Error cargando experiencias:', err);
      }
    });
  }

  onEdit(): void {
    if (this.docenteId) {
      this.edit.emit(this.docenteId);
    }
  }

  setActiveTab(tab: 'info' | 'formacion' | 'experiencia'): void {
    this.activeTab = tab;
  }

  // Método único para formatear fechas
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Métodos para formaciones académicas
  onEditFormacion(id: number): void {
    this.editingFormacionId = id;
    console.log('Editando formación ID:', id);
  }

  onDeleteFormacion(id: number): void {
    // Buscar la formación para mostrar información en el mensaje
    const formacion = this.formaciones.find(f => f.id_formacion === id);
    const formacionNombre = formacion ? `${formacion.titulo} - ${formacion.institucion}` : 'esta formación académica';

    this.confirmService.confirmDelete(
      () => {
        this.formacionAcademicaService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Formación eliminada', `La formación académica "${formacionNombre}" se ha eliminado correctamente.`);
            this.loadFormaciones();
          },
          error: (err) => {
            console.error('Error deleting formacion:', err);
            const errorMessage = err?.error?.message || err.message || 'No se pudo eliminar la formación académica. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar la formación académica "${formacionNombre}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación de formación académica'
    );
  }

  onFormacionSaved(): void {
    this.loadFormaciones();
    this.editingFormacionId = undefined;
  }

  // Métodos para experiencias laborales
  onEditExperiencia(id: number): void {
    this.editingExperienciaId = id;
    console.log('Editando experiencia ID:', id);
  }

  onDeleteExperiencia(id: number): void {
    // Buscar la experiencia para mostrar información en el mensaje
    const experiencia = this.experiencias.find(e => e.id_experiencia === id);
    const experienciaNombre = experiencia ? `${experiencia.cargo_ejercido} - ${experiencia.institucion_empresa}` : 'esta experiencia laboral';

    this.confirmService.confirmDelete(
      () => {
        this.experienciaLaboralService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Experiencia eliminada', `La experiencia laboral "${experienciaNombre}" se ha eliminado correctamente.`);
            this.loadExperiencias();
          },
          error: (err) => {
            console.error('Error deleting experiencia:', err);
            const errorMessage = err?.error?.message || err.message || 'No se pudo eliminar la experiencia laboral. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar la experiencia laboral "${experienciaNombre}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación de experiencia laboral'
    );
  }

  onExperienciaSaved(): void {
    this.loadExperiencias();
    this.editingExperienciaId = undefined;
  }

  // Método para obtener el año de graduación (maneja ambos formatos)
  getAnioGraduacion(formacion: FormacionAcademica): number | null {
    const formacionAny = formacion as any;
    return formacion.anio_graduacion || formacionAny.año_graduacion || null;
  }

  // Métodos para manejar documentos
  hasValidDocument(documentoTitulo?: string): boolean {
    if (!documentoTitulo) return false;
    // Filtrar valores inválidos
    if (documentoTitulo === 'string' || 
        documentoTitulo === 'null' || 
        documentoTitulo === 'undefined' ||
        documentoTitulo.trim() === '') {
      return false;
    }
    // Verificar que sea una URL válida
    return documentoTitulo.startsWith('http://') || documentoTitulo.startsWith('https://');
  }

  getDocumentName(documentoTitulo: string): string {
    if (!documentoTitulo) return 'Documento';
    try {
      const urlParts = documentoTitulo.split('/');
      const fileName = urlParts[urlParts.length - 1];
      // Limpiar parámetros de query si existen
      const cleanName = fileName.split('?')[0];
      return cleanName || 'Documento del Título';
    } catch {
      return 'Documento del Título';
    }
  }

  getDocumentIcon(documentoTitulo: string): string {
    if (!documentoTitulo) return 'fa-file';
    
    const extension = documentoTitulo.toLowerCase().split('.').pop()?.split('?')[0];
    
    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'fa-file-image';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      default:
        return 'fa-file';
    }
  }

  // Métodos para manejar documentos de experiencia laboral
  hasValidDocumentExperiencia(experiencia: ExperienciaLaboral): boolean {
    const doc = experiencia.documento_url;
    if (!doc) return false;
    // Filtrar valores inválidos
    if (doc === 'string' || 
        doc === 'null' || 
        doc === 'undefined' ||
        doc.trim() === '') {
      return false;
    }
    // Verificar que sea una URL válida
    return doc.startsWith('http://') || doc.startsWith('https://');
  }

  getDocumentNameExperiencia(experiencia: ExperienciaLaboral): string {
    const doc = experiencia.documento_url;
    if (!doc) return 'Documento';
    try {
      const urlParts = doc.split('/');
      const fileName = urlParts[urlParts.length - 1];
      // Limpiar parámetros de query si existen
      const cleanName = fileName.split('?')[0];
      return cleanName || 'Documento de Experiencia';
    } catch {
      return 'Documento de Experiencia';
    }
  }

  getDocumentIconExperiencia(experiencia: ExperienciaLaboral): string {
    const doc = experiencia.documento_url;
    if (!doc) return 'fa-file';
    
    const extension = doc.toLowerCase().split('.').pop()?.split('?')[0];
    
    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'fa-file-image';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      default:
        return 'fa-file';
    }
  }

  // Verificar si el documento es una imagen
  isImageDocumentExperiencia(experiencia: ExperienciaLaboral): boolean {
    const doc = experiencia.documento_url;
    if (!doc) return false;
    
    const extension = doc.toLowerCase().split('.').pop()?.split('?')[0];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(extension || '');
  }

  // Manejar error al cargar imagen
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}