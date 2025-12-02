import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';
import { QueryDocenteDto } from '../../models/query-docente.model';

@Component({
  selector: 'app-docente-list',
  templateUrl: './docente-list.component.html',
  styleUrls: ['./docente-list.component.css']
})
export class DocenteListComponent implements OnInit {
  @Output() edit = new EventEmitter<number>();
  @Output() viewDetail = new EventEmitter<number>();

  docentes: Docente[] = [];
  loading = false;
  error = '';

  // Filtros
  filters: QueryDocenteDto = {
    search: '',
    estado: '',
    page: 1,
    limit: 10
  };

  // Paginación
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;
  Math = Math;

  constructor(private docenteService: DocenteService) {}

  ngOnInit(): void {
    this.loadDocentes();
  }

  loadDocentes(): void {
    this.loading = true;
    this.error = '';

    this.docenteService.findAll(this.filters).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.docentes = response;
          this.totalItems = response.length;
        } else {
          this.docentes = response.data;
          this.totalItems = response.total;
          this.currentPage = response.page;
          this.itemsPerPage = response.limit;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los docentes';
        this.loading = false;
        console.error('Error loading docentes:', err);
      }
    });
  }

  onSearch(): void {
    this.filters.page = 1;
    this.loadDocentes();
  }

  onClearFilters(): void {
    this.filters = {
      search: '',
      estado: '',
      page: 1,
      limit: 10
    };
    this.loadDocentes();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadDocentes();
  }

  onEdit(id: number): void {
    this.edit.emit(id);
  }

  onViewDetail(id: number): void {
    this.viewDetail.emit(id);
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este docente?')) {
      this.docenteService.remove(id).subscribe({
        next: () => {
          this.loadDocentes();
        },
        error: (err) => {
          this.error = 'Error al eliminar el docente';
          console.error('Error deleting docente:', err);
        }
      });
    }
  }
}