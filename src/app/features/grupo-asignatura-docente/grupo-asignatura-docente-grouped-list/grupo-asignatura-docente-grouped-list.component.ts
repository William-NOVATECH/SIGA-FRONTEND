import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { GrupoConAsignaciones } from '../models/grupo-asignatura-docente.model';

@Component({
  selector: 'app-grupo-asignatura-docente-grouped-list',
  standalone: false,
  templateUrl: './grupo-asignatura-docente-grouped-list.component.html',
  styleUrls: ['./grupo-asignatura-docente-grouped-list.component.css']
})
export class GrupoAsignaturaDocenteGroupedListComponent implements OnChanges {
  @Input() grupos: GrupoConAsignaciones[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();
  @Output() view = new EventEmitter<number>();
  @Output() viewGrupo = new EventEmitter<number>();
  @Output() createAsignacion = new EventEmitter<number>();

  filteredGrupos: GrupoConAsignaciones[] = [];
  searchTerm: string = '';
  grupoExpandido: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grupos']) {
      this.filteredGrupos = [...this.grupos];
    }
  }

  // CORREGIDO: Solo un grupo puede estar expandido a la vez
  toggleGrupo(idGrupo: number): void {
    console.log('Toggle grupo:', idGrupo, 'Actual:', this.grupoExpandido);
    if (this.grupoExpandido === idGrupo) {
      this.grupoExpandido = null;
    } else {
      this.grupoExpandido = idGrupo;
    }
    console.log('Nuevo estado:', this.grupoExpandido);
  }

  getFechaActualizacion(grupo: GrupoConAsignaciones): Date {
    if (grupo.asignaciones.length === 0) return new Date();
    
    const fechas = grupo.asignaciones.map(a => new Date(a.fecha_asignacion));
    return new Date(Math.max(...fechas.map(d => d.getTime())));
  }

  getIniciales(nombreCompleto: string): string {
    return nombreCompleto
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  onView(id: number): void {
    this.view.emit(id);
  }

  onViewGrupo(idGrupo: number): void {
    this.viewGrupo.emit(idGrupo);
  }

  onCreateAsignacion(idGrupo: number): void {
    this.createAsignacion.emit(idGrupo);
  }

  onSearch(): void {
    if (!this.searchTerm) {
      this.filteredGrupos = [...this.grupos];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredGrupos = this.grupos.filter(grupo =>
      grupo.codigo_grupo.toLowerCase().includes(term) ||
      grupo.nombre_grupo?.toLowerCase().includes(term) ||
      grupo.carrera.nombre_carrera.toLowerCase().includes(term) ||
      grupo.carrera.codigo_carrera?.toLowerCase().includes(term)
    );
  }

  onEdit(id: number): void {
    this.edit.emit(id);
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta asignación?')) {
      this.delete.emit(id);
    }
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'activa':
        return 'estado-activa';
      case 'finalizada':
        return 'estado-finalizada';
      case 'cancelada':
        return 'estado-cancelada';
      default:
        return 'estado-default';
    }
  }
}