import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';
import { QueryDocenteDto } from '../../models/query-docente.model';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

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

  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  constructor(
    private docenteService: DocenteService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.setupTable();
    this.loadDocentes();
  }

  setupTable(): void {
    this.columns = [
      { 
        field: 'codigo_docente', 
        header: 'Código', 
        sortable: true, 
        width: '10%',
        template: 'badge',
        badgeClass: () => 'code-badge'
      },
      { 
        field: 'nombres', 
        header: 'Nombres', 
        sortable: true, 
        width: '15%' 
      },
      { 
        field: 'apellidos', 
        header: 'Apellidos', 
        sortable: true, 
        width: '15%' 
      },
      { 
        field: 'identificacion', 
        header: 'Identificación', 
        sortable: true, 
        width: '12%' 
      },
      {
        field: 'departamento.nombre_departamento',
        header: 'Departamento',
        sortable: true,
        width: '15%',
        template: 'badge',
        badgeClass: () => 'department-badge',
        format: (value, row) => row?.departamento?.nombre_departamento || 'N/A'
      },
      {
        field: 'cargo.nombre_cargo',
        header: 'Cargo',
        sortable: true,
        width: '12%',
        format: (value, row) => row?.cargo?.nombre_cargo || 'N/A'
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
        handler: (row: Docente) => this.onViewDetail(row.id_docente)
      },
      {
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-edit',
        handler: (row: Docente) => this.onEdit(row.id_docente)
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-delete',
        handler: (row: Docente) => this.onDelete(row.id_docente)
      }
    ];
  }

  loadDocentes(): void {
    this.loading = true;
    this.error = '';

    // Cargar todos los docentes sin paginación del backend, la paginación será local
    const filters: QueryDocenteDto = {
      search: '',
      estado: ''
    };

    this.docenteService.findAll(filters).subscribe({
      next: (response: any) => {
        let docentesRaw: any[] = [];
        
        if (Array.isArray(response)) {
          docentesRaw = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          docentesRaw = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          docentesRaw = [];
        }

        this.docentes = docentesRaw;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading docentes:', err);
        const errorMessage = err?.error?.message || 'No se pudieron cargar los docentes. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar', errorMessage);
        this.docentes = [];
        this.loading = false;
      }
    });
  }

  onEdit(id: number): void {
    this.edit.emit(id);
  }

  onViewDetail(id: number): void {
    this.viewDetail.emit(id);
  }

  onDelete(id: number): void {
    this.confirmService.confirmDelete(
      () => {
        this.docenteService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Docente eliminado', 'El docente se ha eliminado correctamente.');
            this.loadDocentes();
          },
          error: (err) => {
            console.error('Error deleting docente:', err);
            const errorMessage = err?.error?.message || 'No se pudo eliminar el docente. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      '¿Estás seguro de que quieres eliminar este docente? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }
}