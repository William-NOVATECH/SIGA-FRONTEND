import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrupoAsignaturaDocente } from '../models/grupo-asignatura-docente.model';

@Component({
  selector: 'app-grupo-asignatura-docente-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grupo-asignatura-docente-list.component.html',
  styleUrls: ['./grupo-asignatura-docente-list.component.css']
})
export class GrupoAsignaturaDocenteListComponent implements OnChanges {
  @Input() asignaciones: GrupoAsignaturaDocente[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();
  @Output() view = new EventEmitter<number>(); // Agregar este Output

  filteredAsignaciones: GrupoAsignaturaDocente[] = [];
  searchTerm: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['asignaciones']) {
      this.filteredAsignaciones = [...this.asignaciones];
    }
  }

onView(id: number): void {
  console.log('View button clicked for ID:', id); // Debug
  this.view.emit(id);
}

  onSearch(): void {
    if (!this.searchTerm) {
      this.filteredAsignaciones = [...this.asignaciones];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredAsignaciones = this.asignaciones.filter(asignacion =>
      asignacion.grupo?.codigo_grupo.toLowerCase().includes(term) ||
      asignacion.asignatura?.nombre_asignatura.toLowerCase().includes(term) ||
      asignacion.docente?.nombres.toLowerCase().includes(term) ||
      asignacion.docente?.apellidos.toLowerCase().includes(term) ||
      asignacion.estado.toLowerCase().includes(term)
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