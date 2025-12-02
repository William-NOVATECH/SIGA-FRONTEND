import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { DocenteService } from '../../services/docente.service';
import { FormacionAcademicaService } from '../../services/formacion-academica.service';
import { ExperienciaLaboralService } from '../../services/experiencia-laboral.service';
import { Docente } from '../../models/docente.model';
import { FormacionAcademica } from '../../models/formacion-academica.model';
import { ExperienciaLaboral } from '../../models/experiencia-laboral.model';

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
    private experienciaLaboralService: ExperienciaLaboralService
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
    if (confirm('¿Está seguro de que desea eliminar esta formación académica?')) {
      this.formacionAcademicaService.remove(id).subscribe({
        next: () => {
          this.loadFormaciones();
        },
        error: (err) => {
          console.error('Error deleting formacion:', err);
        }
      });
    }
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
    if (confirm('¿Está seguro de que desea eliminar esta experiencia laboral?')) {
      this.experienciaLaboralService.remove(id).subscribe({
        next: () => {
          this.loadExperiencias();
        },
        error: (err) => {
          console.error('Error deleting experiencia:', err);
        }
      });
    }
  }

  onExperienciaSaved(): void {
    this.loadExperiencias();
    this.editingExperienciaId = undefined;
  }
}