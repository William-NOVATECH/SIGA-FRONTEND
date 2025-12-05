import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GrupoService } from '../../services/grupo.service';
import { Grupo, QueryGrupoDto, PaginatedResponse, Carrera } from '../../models/grupo.model';
import { CarreraService } from '../../services/carrera.service';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-grupo-list',
  templateUrl: './grupo-list.component.html',
  styleUrls: ['./grupo-list.component.css']
})
export class GrupoListComponent implements OnInit {
  grupos: Grupo[] = [];
  carreras: Carrera[] = [];
  
  searchTerm: string = '';
  estadoFilter: string = '';
  loading = false;
  
  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  constructor(
    private grupoService: GrupoService,
    private carreraService: CarreraService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.setupTable();
    this.loadInitialData();
  }

  setupTable(): void {
    this.columns = [
      { 
        field: 'codigo_grupo', 
        header: 'Código', 
        sortable: true, 
        width: '12%',
        template: 'badge',
        badgeClass: () => 'code-badge'
      },
      { 
        field: 'nombre_grupo', 
        header: 'Nombre', 
        sortable: true, 
        width: '20%',
        format: (value) => value || 'Sin nombre'
      },
      {
        field: 'carrera.nombre_carrera',
        header: 'Carrera',
        sortable: true,
        width: '20%',
        template: 'badge',
        badgeClass: () => 'career-badge',
        format: (value, row) => {
          if (row?.carrera?.nombre_carrera) {
            return row.carrera.nombre_carrera;
          }
          return 'Sin carrera';
        }
      },
      { 
        field: 'periodo_academico', 
        header: 'Periodo', 
        sortable: true, 
        width: '12%' 
      },
      {
        field: 'estado',
        header: 'Estado',
        sortable: true,
        width: '10%',
        template: 'status',
        badgeClass: (value) => (value === 'activo' ? 'status-active' : 'status-inactive'),
        format: (value) => (value === 'activo' ? 'Activo' : 'Inactivo')
      }
    ];

    this.actions = [
      {
        label: 'Ver',
        icon: 'fa-eye',
        class: 'btn-view',
        handler: (row: Grupo) => this.viewGrupo(row.id_grupo)
      },
      {
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-edit',
        handler: (row: Grupo) => this.editGrupo(row.id_grupo)
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-delete',
        handler: (row: Grupo) => this.deleteGrupo(row.id_grupo)
      }
    ];
  }

  async loadInitialData(): Promise<void> {
    this.loading = true;
    
    try {
      await this.loadCarreras();
      await this.loadGrupos();
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.toastService.showError('Error al cargar', 'No se pudieron cargar los datos. Por favor, intente nuevamente.');
    } finally {
      this.loading = false;
    }
  }

  async loadGrupos(): Promise<void> {
    return new Promise((resolve) => {
      // Cargar todos los grupos sin paginación del backend, la paginación será local
      const query: QueryGrupoDto = {
        search: this.searchTerm || undefined,
        estado: this.estadoFilter || undefined
      };

      this.grupoService.findAll(query).subscribe({
        next: (response: any) => {
          let gruposRaw: any[] = [];
          
          if (this.isPaginatedResponse(response)) {
            gruposRaw = response.data;
          } else if (Array.isArray(response)) {
            gruposRaw = response;
          } else if (response && typeof response === 'object' && 'data' in response) {
            const responseData = (response as any).data;
            gruposRaw = Array.isArray(responseData) ? responseData : [responseData];
          } else {
            gruposRaw = [];
          }

          this.grupos = gruposRaw.map(grupoRaw => this.adaptarGrupo(grupoRaw));
          this.enriquecerGrupos();
          resolve();
        },
        error: (error) => {
          console.error('Error loading grupos:', error);
          const errorMessage = error?.error?.message || 'No se pudieron cargar los grupos. Por favor, intente nuevamente.';
          this.toastService.showError('Error al cargar', errorMessage);
          this.grupos = [];
          resolve();
        }
      });
    });
  }

  private adaptarGrupo(grupoRaw: any): Grupo {
    let idCarrera = grupoRaw.id_carrera;
    if (!idCarrera && grupoRaw.carrera) {
      idCarrera = grupoRaw.carrera.id_carrera;
    }

    let idPlan = grupoRaw.id_plan;
    if (!idPlan && grupoRaw.plan) {
      idPlan = grupoRaw.plan.id_plan;
    }

    let idDocenteTitular = grupoRaw.id_docente_titular;
    if (!idDocenteTitular && grupoRaw.docente_titular) {
      idDocenteTitular = grupoRaw.docente_titular.id_docente;
    }

    return {
      id_grupo: grupoRaw.id_grupo,
      id_carrera: idCarrera,
      id_plan: idPlan || 0, // Valor por defecto si no existe
      codigo_grupo: grupoRaw.codigo_grupo,
      nombre_grupo: grupoRaw.nombre_grupo,
      periodo_academico: grupoRaw.periodo_academico,
      id_docente_titular: idDocenteTitular,
      estado: grupoRaw.estado,
      min_asignaturas: grupoRaw.min_asignaturas,
      max_asignaturas: grupoRaw.max_asignaturas,
      carrera: grupoRaw.carrera,
      plan: grupoRaw.plan,
      docente_titular: grupoRaw.docente_titular,
      asignaturas_docentes: grupoRaw.asignaturas_docentes
    };
  }

  async loadCarreras(): Promise<void> {
    return new Promise((resolve) => {
      this.carreraService.findAll().subscribe({
        next: (carrerasResponse: any) => {
          console.log('Respuesta completa de carreras:', carrerasResponse);
          console.log('Tipo de respuesta:', typeof carrerasResponse);
          console.log('Es array?', Array.isArray(carrerasResponse));
          
          // ✅ CORREGIDO: Manejar diferentes formatos de respuesta de manera segura
          if (Array.isArray(carrerasResponse)) {
            this.carreras = carrerasResponse;
          } else if (carrerasResponse && typeof carrerasResponse === 'object') {
            // Si es un objeto con propiedad data (respuesta paginada)
            if (carrerasResponse.data && Array.isArray(carrerasResponse.data)) {
              this.carreras = carrerasResponse.data;
            } else {
              // Si es un objeto único, intentar convertirlo a array
              this.carreras = Object.values(carrerasResponse).filter(item => 
                item && typeof item === 'object' && 'id_carrera' in item
              ) as Carrera[];
            }
          } else {
            this.carreras = [];
          }
          
          console.log('Carreras procesadas:', this.carreras);
          resolve();
        },
        error: (error) => {
          console.error('Error cargando carreras:', error);
          this.carreras = [];
          resolve();
        }
      });
    });
  }

  enriquecerGrupos(): void {
    // ✅ CORREGIDO: Verificar que carreras sea un array válido
    if (!Array.isArray(this.carreras) || this.carreras.length === 0) {
      console.log('No hay carreras disponibles para enriquecer grupos');
      return;
    }

    this.grupos = this.grupos.map(grupo => {
      let carreraEncontrada: Carrera | undefined;
      
      if (grupo.id_carrera) {
        carreraEncontrada = this.carreras.find(c => c.id_carrera === grupo.id_carrera);
      }

      return {
        ...grupo,
        carrera: carreraEncontrada || grupo.carrera
      };
    });
  }

  private isPaginatedResponse(response: any): response is PaginatedResponse<Grupo> {
    return response && 
           typeof response === 'object' && 
           'data' in response && 
           'total' in response &&
           Array.isArray(response.data);
  }

  onSearch(): void {
    this.loadGrupos();
  }

  onEstadoFilterChange(): void {
    this.loadGrupos();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.estadoFilter = '';
    this.loadGrupos();
  }

  createGrupo(): void {
    this.router.navigate(['/grupos/new']);
  }

  viewGrupo(id: number): void {
    this.router.navigate(['/grupos', id]);
  }

  editGrupo(id: number): void {
    this.router.navigate(['/grupos', id, 'edit']);
  }

  deleteGrupo(id: number): void {
    this.confirmService.confirmDelete(
      () => {
        this.grupoService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Grupo eliminado', 'El grupo se ha eliminado correctamente.');
            this.loadGrupos();
          },
          error: (error) => {
            console.error('Error deleting grupo:', error);
            const errorMessage = error?.error?.message || 'No se pudo eliminar el grupo. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      '¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }

  getNombreCarrera(grupo: Grupo): string {
    if (grupo.carrera) {
      return grupo.carrera.nombre_carrera;
    }
    return 'Sin carrera';
  }
}