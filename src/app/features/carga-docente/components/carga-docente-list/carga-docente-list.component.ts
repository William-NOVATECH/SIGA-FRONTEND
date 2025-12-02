import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CargaDocenteService } from '../../services/carga-docente.service';
import { CargaDocenteWithRelations } from '../../models/carga-docente.model';
import { QueryCargaDocente, CargaDocenteResponse } from '../../interfaces/query-carga-docente.interface';

@Component({
  selector: 'app-carga-docente-list',
  templateUrl: './carga-docente-list.component.html',
  styleUrls: ['./carga-docente-list.component.css']
})
export class CargaDocenteListComponent implements OnInit {
parseInt(arg0: any): number|undefined {
throw new Error('Method not implemented.');
}
  @Output() edit = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  cargas: CargaDocenteWithRelations[] = [];
  loading = false;
  error = '';

  // Filtros
  filters: QueryCargaDocente = {
    page: 1,
    limit: 10
  };

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;

  constructor(private cargaDocenteService: CargaDocenteService) {}

  ngOnInit(): void {
    this.loadCargas();
  }

  loadCargas(): void {
    this.loading = true;
    this.cargaDocenteService.findAll(this.filters).subscribe({
      next: (response: CargaDocenteResponse) => {
        // Verificar si las relaciones ya vienen en la respuesta
        if (response.data.length > 0 && response.data[0].docente) {
          // Si ya vienen las relaciones, usar directamente
          this.cargas = response.data;
          this.finalizeLoading(response);
        } else {
          // Si no vienen las relaciones, cargarlas manualmente
          this.cargaDocenteService.loadRelationsForCargas(response.data).subscribe({
            next: (cargasWithRelations) => {
              this.cargas = cargasWithRelations;
              this.finalizeLoading(response);
            },
            error: (error) => {
              console.error('Error al cargar relaciones:', error);
              // Aún así mostrar las cargas sin relaciones
              this.cargas = response.data;
              this.finalizeLoading(response);
            }
          });
        }
      },
      error: (error) => {
        this.error = 'Error al cargar las cargas docentes';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  private finalizeLoading(response: CargaDocenteResponse): void {
    this.totalItems = response.total;
    this.currentPage = response.page;
    this.loading = false;
    
    // Debug: verificar datos cargados
    console.log('Cargas cargadas:', this.cargas);
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadCargas();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 10
    };
    this.loadCargas();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadCargas();
  }

  onEdit(id: number): void {
    this.edit.emit(id);
  }

  onView(id: number): void {
    this.view.emit(id);
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta carga docente?')) {
      this.delete.emit(id);
    }
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'asignada': 'badge bg-primary',
      'finalizada': 'badge bg-success',
      'cancelada': 'badge bg-danger'
    };
    return classes[estado] || 'badge bg-secondary';
  }

  getTipoVinculacionClass(tipo: string): string {
    const classes: { [key: string]: string } = {
      'titular': 'badge bg-info',
      'suplente': 'badge bg-warning',
      'auxiliar': 'badge bg-secondary',
      'coordinador': 'badge bg-dark'
    };
    return classes[tipo] || 'badge bg-light';
  }
}
