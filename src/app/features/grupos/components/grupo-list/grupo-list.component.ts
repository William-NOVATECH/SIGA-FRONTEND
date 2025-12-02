import { Component, OnInit } from '@angular/core';
import { GrupoService } from '../../services/grupo.service';
import { Grupo, QueryGrupoDto, PaginatedResponse, Carrera } from '../../models/grupo.model';
import { CarreraService } from '../../services/carrera.service';

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
  isLoading = false;
  
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private grupoService: GrupoService,
    private carreraService: CarreraService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    
    try {
      await this.loadCarreras();
      await this.loadGrupos();
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadGrupos(): Promise<void> {
    return new Promise((resolve) => {
      const query: QueryGrupoDto = {
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm || undefined,
        estado: this.estadoFilter || undefined
      };

      this.grupoService.findAll(query).subscribe({
        next: (response) => {
          let gruposRaw: any[];
          
          if (this.isPaginatedResponse(response)) {
            gruposRaw = response.data;
            this.totalItems = response.total;
          } else {
            gruposRaw = response as any[];
            this.totalItems = gruposRaw.length;
          }

          this.grupos = gruposRaw.map(grupoRaw => this.adaptarGrupo(grupoRaw));
          this.enriquecerGrupos();
          resolve();
        },
        error: (error) => {
          console.error('Error loading grupos:', error);
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

    return {
      id_grupo: grupoRaw.id_grupo,
      id_carrera: idCarrera,
      codigo_grupo: grupoRaw.codigo_grupo,
      nombre_grupo: grupoRaw.nombre_grupo,
      periodo_academico: grupoRaw.periodo_academico,
      estado: grupoRaw.estado,
      min_asignaturas: grupoRaw.min_asignaturas,
      max_asignaturas: grupoRaw.max_asignaturas,
      carrera: grupoRaw.carrera,
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
    this.currentPage = 1;
    this.loadGrupos();
  }

  onEstadoFilterChange(): void {
    this.currentPage = 1;
    this.loadGrupos();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.estadoFilter = '';
    this.currentPage = 1;
    this.loadGrupos();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadGrupos();
  }

  deleteGrupo(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este grupo?')) {
      this.grupoService.remove(id).subscribe({
        next: () => {
          this.loadGrupos();
        },
        error: (error) => {
          console.error('Error deleting grupo:', error);
          alert('Error al eliminar el grupo: ' + error.message);
        }
      });
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getNombreCarrera(grupo: Grupo): string {
    if (grupo.carrera) {
      return grupo.carrera.nombre_carrera;
    }
    return 'Sin carrera';
  }
}