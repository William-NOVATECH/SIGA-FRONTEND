// features/carreras/components/carrera-list/carrera-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarreraService } from '../../services/carrera.service';
import { Carrera, CarreraResponse } from '../../models/carrera.model';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-carrera-list',
  standalone: false,
  templateUrl: './carrera-list.component.html',
  styleUrls: ['./carrera-list.component.css'] 
})
export class CarreraListComponent implements OnInit {
  carreras: Carrera[] = [];
  loading = false;
  errorMessage = '';

  // Configuración de columnas para la tabla
  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  constructor(
    private carreraService: CarreraService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit() {
    this.setupTable();
    this.loadCarreras();
  }

  setupTable(): void {
    this.columns = [
      {
        field: 'codigo_carrera',
        header: 'Código',
        sortable: true,
        width: '120px',
        template: 'badge'
      },
      {
        field: 'nombre_carrera',
        header: 'Nombre',
        sortable: true
      },
      {
        field: 'departamento',
        header: 'Departamento',
        sortable: true,
        template: 'badge',
        format: (value, item) => {
          if (!item.departamento) return 'N/A';
          return item.departamento.nombre_departamento || 'N/A';
        },
        badgeClass: () => 'department-badge'
      },
      {
        field: 'duracion_semestres',
        header: 'Duración',
        sortable: true,
        width: '120px',
        format: (value) => value ? `${value} semestres` : '-'
      },
      {
        field: 'titulo_otorga',
        header: 'Título',
        sortable: true,
        format: (value) => value || '-'
      },
      {
        field: 'estado',
        header: 'Estado',
        sortable: true,
        template: 'status',
        badgeClass: (value) => value === 'activa' ? 'status-active' : 'status-inactive',
        format: (value) => value === 'activa' ? 'Activa' : 'Inactiva'
      }
    ];

    this.actions = [
      {
        label: 'Ver',
        icon: 'fa-eye',
        class: 'btn-view',
        handler: (row: Carrera) => this.viewCarrera(row.id_carrera)
      },
      {
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-edit',
        handler: (row: Carrera) => this.editCarrera(row.id_carrera)
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-delete',
        handler: (row: Carrera) => this.deleteCarrera(row.id_carrera)
      }
    ];
  }

  loadCarreras() {
    this.loading = true;
    this.errorMessage = '';
    
    this.carreraService.findAll().subscribe({
      next: (response: CarreraResponse) => {
        this.carreras = Array.isArray(response.data) ? response.data : [response.data];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading carreras:', error);
        this.errorMessage = 'Error al cargar las carreras';
        this.toastService.showError('Error', 'No se pudieron cargar las carreras');
        this.loading = false;
      }
    });
  }

  createCarrera() {
    this.router.navigate(['/carreras/crear']);
  }

  editCarrera(id: number) {
    this.router.navigate(['/carreras/editar', id]);
  }

  viewCarrera(id: number) {
    this.router.navigate(['/carreras/detalle', id]);
  }

  deleteCarrera(id: number) {
    this.confirmService.confirmDelete(
      () => {
        this.carreraService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Carrera eliminada', 'La carrera se ha eliminado correctamente.');
            this.loadCarreras();
          },
          error: (error) => {
            console.error('Error deleting carrera:', error);
            const errorMessage = error?.error?.message || 'No se pudo eliminar la carrera. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      '¿Estás seguro de que quieres eliminar esta carrera? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }
}

