import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartamentoService } from '../../services/departamento.service';
import { Departamento, QueryDepartamento, DepartamentoResponse } from '../../models/departamento.model';

@Component({
  selector: 'app-departamento-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departamento-list.component.html',
  styleUrls: ['./departamento-list.component.css']
})
export class DepartamentoListComponent implements OnInit {
  departamentos: Departamento[] = [];
  filteredDepartamentos: Departamento[] = [];
  filterForm: FormGroup;
  loading = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private departamentoService: DepartamentoService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      estado: [''],
      orderBy: ['nombre_departamento'],
      orderDirection: ['ASC']
    });
  }

  ngOnInit() {
    this.loadDepartamentos();
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadDepartamentos();
    });
  }

  loadDepartamentos() {
    this.loading = true;
    const query: QueryDepartamento = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Limpiar valores vacíos
    Object.keys(query).forEach(key => {
      if (!query[key as keyof QueryDepartamento]) {
        delete query[key as keyof QueryDepartamento];
      }
    });

    this.departamentoService.findAll(query).subscribe({
      next: (response) => {
        if (this.isPaginatedResponse(response)) {
          this.departamentos = response.data;
          this.totalItems = response.total;
        } else {
          this.departamentos = response;
          this.totalItems = response.length;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading departamentos:', error);
        this.loading = false;
      }
    });
  }

  private isPaginatedResponse(response: any): response is DepartamentoResponse {
    return response && typeof response === 'object' && 'data' in response && 'total' in response;
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadDepartamentos();
  }

  editDepartamento(id: number) {
    this.router.navigate(['/departamentos/editar', id]);
  }

  createDepartamento() {
    this.router.navigate(['/departamentos/crear']);
  }

  deleteDepartamento(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este departamento?')) {
      this.departamentoService.remove(id).subscribe({
        next: () => {
          this.loadDepartamentos();
        },
        error: (error) => {
          console.error('Error deleting departamento:', error);
        }
      });
    }
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      estado: '',
      orderBy: 'nombre_departamento',
      orderDirection: 'ASC'
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}