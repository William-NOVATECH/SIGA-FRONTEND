// features/asignaturas/components/asignatura-list/asignatura-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AsignaturaService } from '../../services/asignatura.service';
import { Asignatura } from '../../models/asignatura.model';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-asignatura-list',
  standalone: false,
  templateUrl: './asignatura-list.component.html',
  styleUrls: ['./asignatura-list.component.css'] 
})
export class AsignaturaListComponent implements OnInit {
  asignaturas: Asignatura[] = [];
  loading = false;
  errorMessage = '';

  // Configuración de columnas para la tabla
  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  constructor(
    private asignaturaService: AsignaturaService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit() {
    this.setupTable();
    this.loadAsignaturas();
  }

  setupTable(): void {
    this.columns = [
      {
        field: 'codigo_asignatura',
        header: 'Código',
        sortable: true,
        width: '120px',
        template: 'badge'
      },
      {
        field: 'nombre_asignatura',
        header: 'Nombre',
        sortable: true
      },
      {
        field: 'carrera',
        header: 'Carrera',
        sortable: true,
        template: 'badge',
        format: (value, item) => {
          if (!item.carrera) return 'N/A';
          if (typeof item.carrera === 'object' && item.carrera.nombre_carrera) {
            return item.carrera.nombre_carrera;
          }
          return 'Carrera ' + item.id_carrera;
        },
        badgeClass: () => 'career-badge'
      },
      {
        field: 'creditos',
        header: 'Créditos',
        sortable: true,
        width: '100px'
      },
      {
        field: 'horas_semanales',
        header: 'Horas',
        sortable: true,
        width: '100px'
      },
      {
        field: 'semestre',
        header: 'Semestre',
        sortable: true,
        width: '100px',
        format: (value) => value || '-'
      },
      {
        field: 'tipo',
        header: 'Tipo',
        sortable: true,
        template: 'badge',
        badgeClass: (value) => {
          switch (value) {
            case 'obligatoria':
              return 'type-badge type-obligatoria';
            case 'optativa':
              return 'type-badge type-optativa';
            default:
              return 'type-badge type-default';
          }
        }
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
        handler: (row: Asignatura) => this.viewAsignatura(row.id_asignatura)
      },
      {
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-edit',
        handler: (row: Asignatura) => this.editAsignatura(row.id_asignatura)
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-delete',
        handler: (row: Asignatura) => this.deleteAsignatura(row.id_asignatura)
      }
    ];
  }

  loadAsignaturas() {
    this.loading = true;
    this.errorMessage = '';
    
    this.asignaturaService.findAll().subscribe({
      next: (asignaturas) => {
        console.log('Respuesta del backend:', asignaturas); 
        this.asignaturas = asignaturas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading asignaturas:', error);
        this.errorMessage = 'Error al cargar las asignaturas';
        this.toastService.showError('Error', 'No se pudieron cargar las asignaturas');
        this.loading = false;
      }
    });
  }

  createAsignatura() {
    this.router.navigate(['/asignaturas/crear']);
  }

  editAsignatura(id: number) {
    this.router.navigate(['/asignaturas/editar', id]);
  }

  viewAsignatura(id: number) {
    this.router.navigate(['/asignaturas/detalle', id]);
  }

  deleteAsignatura(id: number) {
    this.confirmService.confirmDelete(
      () => {
        this.asignaturaService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Asignatura eliminada', 'La asignatura se ha eliminado correctamente.');
            this.loadAsignaturas();
          },
          error: (error) => {
            console.error('Error deleting asignatura:', error);
            const errorMessage = error?.error?.message || 'No se pudo eliminar la asignatura. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      '¿Estás seguro de que quieres eliminar esta asignatura? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }
}