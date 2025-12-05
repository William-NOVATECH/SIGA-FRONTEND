import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CargoDocenteService } from '../../services/cargo-docente.service';
import { CargoDocente } from '../../models/cargo-docente.model';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-cargo-docente-list',
  templateUrl: './cargo-docente-list.component.html',
  styleUrls: ['./cargo-docente-list.component.css']
})
export class CargoDocenteListComponent implements OnInit {
  @Output() edit = new EventEmitter<number>();

  cargos: CargoDocente[] = [];
  loading = false;
  error = '';

  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  constructor(
    private cargoDocenteService: CargoDocenteService,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.setupTable();
    this.loadCargos();
  }

  setupTable(): void {
    this.columns = [
      { 
        field: 'nombre_cargo', 
        header: 'Nombre del Cargo', 
        sortable: true, 
        width: '20%' 
      },
      { 
        field: 'descripcion', 
        header: 'Descripción', 
        sortable: true, 
        width: '30%',
        format: (value) => value || 'Sin descripción'
      },
      { 
        field: 'max_asignaturas', 
        header: 'Máx. Asignaturas', 
        sortable: true, 
        width: '15%' 
      },
      { 
        field: 'min_asignaturas', 
        header: 'Mín. Asignaturas', 
        sortable: true, 
        width: '15%',
        format: (value) => value || 0
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
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-edit',
        handler: (row: CargoDocente) => this.onEdit(row.id_cargo)
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-delete',
        handler: (row: CargoDocente) => this.onDelete(row.id_cargo)
      }
    ];
  }

  loadCargos(): void {
    this.loading = true;
    this.cargoDocenteService.findAll().subscribe({
      next: (response: any) => {
        let cargosRaw: any[] = [];
        
        if (Array.isArray(response)) {
          cargosRaw = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          cargosRaw = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          cargosRaw = [];
        }

        this.cargos = cargosRaw;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando cargos:', err);
        const errorMessage = err?.error?.message || 'No se pudieron cargar los cargos docentes. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar', errorMessage);
        this.cargos = [];
        this.loading = false;
      }
    });
  }

  onEdit(id: number): void {
    this.edit.emit(id);
  }

  onDelete(id: number): void {
    this.confirmService.confirmDelete(
      () => {
        this.cargoDocenteService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Cargo eliminado', 'El cargo docente se ha eliminado correctamente.');
            this.loadCargos();
          },
          error: (err) => {
            console.error('Error deleting cargo:', err);
            let errorMessage = 'No se pudo eliminar el cargo docente. Por favor, intente nuevamente.';
            if (err.status === 400) {
              errorMessage = err.error?.message || 'No se puede eliminar el cargo porque hay docentes asignados';
            }
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      '¿Estás seguro de que quieres eliminar este cargo docente? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }
}
