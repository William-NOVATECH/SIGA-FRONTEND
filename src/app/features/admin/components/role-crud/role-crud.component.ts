import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService } from '../../services/rol.service';
import { Rol, CreateRol, UpdateRol, QueryRol } from '../../interfaces/rol.interface';
import { PaginatedResponse } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-role-crud',
  templateUrl: './role-crud.component.html',
  styleUrls: ['./role-crud.component.css']
})
export class RoleCrudComponent implements OnInit {
  // Lista de roles
  roles: Rol[] = [];
  paginatedResponse?: PaginatedResponse<Rol>;
  
  // Formularios
  rolForm: FormGroup;
  editRolForm: FormGroup;
  
  // Estados
  loading: boolean = true;
  creating: boolean = false;
  editing: boolean = false;
  error: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  // Filtros
  searchTerm: string = '';
  nivelAccesoFilter?: number;
  
  // Rol seleccionado para editar
  selectedRol?: Rol;

  constructor(
    private rolService: RolService,
    private fb: FormBuilder
  ) {
    this.rolForm = this.fb.group({
      nombre_rol: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', [Validators.maxLength(255)]],
      nivel_acceso: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    this.editRolForm = this.fb.group({
      nombre_rol: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', [Validators.maxLength(255)]],
      nivel_acceso: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    const query: QueryRol = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined,
      nivel_acceso: this.nivelAccesoFilter,
      orderBy: 'nivel_acceso',
      orderDirection: 'DESC'
    };

    this.rolService.getRoles(query).subscribe({
      next: (response) => {
        if (this.isPaginatedResponse(response)) {
          this.paginatedResponse = response;
          this.roles = response.data;
          this.totalItems = response.total;
        } else {
          this.roles = response;
          this.totalItems = response.length;
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los roles';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  private isPaginatedResponse(response: any): response is PaginatedResponse<Rol> {
    return response && typeof response === 'object' && 'data' in response && 'total' in response;
  }

  // ========== CRUD OPERATIONS ==========

  crearRol(): void {
    if (this.rolForm.valid) {
      this.creating = true;
      const rolData: CreateRol = this.rolForm.value;

      this.rolService.createRol(rolData).subscribe({
        next: (nuevoRol) => {
          this.roles.unshift(nuevoRol);
          this.rolForm.reset({ nivel_acceso: 1 });
          this.creating = false;
          this.cargarRoles(); // Recargar para mantener consistencia con paginación
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al crear el rol';
          this.creating = false;
        }
      });
    }
  }

  editarRol(rol: Rol): void {
    this.selectedRol = rol;
    this.editRolForm.patchValue({
      nombre_rol: rol.nombre_rol,
      descripcion: rol.descripcion || '',
      nivel_acceso: rol.nivel_acceso
    });
    this.editing = true;
  }

  actualizarRol(): void {
    if (this.editRolForm.valid && this.selectedRol) {
      const rolData: UpdateRol = this.editRolForm.value;

      this.rolService.updateRol(this.selectedRol.id_rol, rolData).subscribe({
        next: (rolActualizado) => {
          const index = this.roles.findIndex(r => r.id_rol === rolActualizado.id_rol);
          if (index !== -1) {
            this.roles[index] = rolActualizado;
          }
          this.cancelarEdicion();
          this.cargarRoles(); // Recargar para mantener consistencia
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al actualizar el rol';
        }
      });
    }
  }

  eliminarRol(rol: Rol): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el rol "${rol.nombre_rol}"?`)) {
      this.rolService.deleteRol(rol.id_rol).subscribe({
        next: () => {
          this.roles = this.roles.filter(r => r.id_rol !== rol.id_rol);
          this.cargarRoles(); // Recargar para mantener consistencia con paginación
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al eliminar el rol';
        }
      });
    }
  }

  cancelarEdicion(): void {
    this.editing = false;
    this.selectedRol = undefined;
    this.editRolForm.reset({ nivel_acceso: 1 });
  }

  // ========== PAGINATION ==========

  cambiarPagina(pagina: number): void {
    this.currentPage = pagina;
    this.cargarRoles();
  }

  // ========== FILTERS ==========

  buscarRoles(): void {
    this.currentPage = 1;
    this.cargarRoles();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.nivelAccesoFilter = undefined;
    this.currentPage = 1;
    this.cargarRoles();
  }

  // ========== UTILITIES ==========

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getNivelAccesoTexto(nivel: number): string {
    if (nivel >= 8) return 'Muy Alto';
    if (nivel >= 6) return 'Alto';
    if (nivel >= 4) return 'Medio';
    if (nivel >= 2) return 'Básico';
    return 'Mínimo';
  }

  getBadgeClass(nivel: number): string {
    if (nivel >= 8) return 'bg-danger';
    if (nivel >= 6) return 'bg-warning';
    if (nivel >= 4) return 'bg-info';
    if (nivel >= 2) return 'bg-success';
    return 'bg-secondary';
  }
}