import { Component, OnInit } from '@angular/core';
import { RolService } from '../../services/rol.service';
import { Rol, CreateRol, UpdateRol } from '../../interfaces/rol.interface';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ExportService } from '../../../../core/services/export.service';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';

@Component({
  selector: 'app-role-management-table',
  templateUrl: './role-management-table.component.html',
  styleUrls: ['./role-management-table.component.css']
})
export class RoleManagementTableComponent implements OnInit {
  roles: Rol[] = [];
  loading: boolean = false;
  error: string = '';

  // Configuración de la tabla
  columns: TableColumn[] = [
    { field: 'id_rol', header: 'ID', sortable: true, width: '80px' },
    { field: 'nombre_rol', header: 'Nombre del Rol', sortable: true },
    { 
      field: 'descripcion', 
      header: 'Descripción', 
      sortable: true,
      format: (value: string) => {
        return value || 'Sin descripción';
      }
    },
    { 
      field: 'nivel_acceso', 
      header: 'Nivel de Acceso', 
      sortable: true,
      template: 'badge',
      badgeClass: (value: number) => {
        if (value >= 5) return 'badge-level-high';
        if (value >= 3) return 'badge-level-medium';
        return 'badge-level-low';
      },
      format: (value: number) => {
        return `Nivel ${value}`;
      }
    }
  ];

  actions: TableAction[] = [];

  // Modales
  showCreateModal = false;
  showEditModal = false;
  rolSeleccionado?: Rol;
  
  // Formularios
  createForm: CreateRol = {
    nombre_rol: '',
    descripcion: '',
    nivel_acceso: 1
  };

  editForm: UpdateRol = {};

  constructor(
    private rolService: RolService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private exportService: ExportService
  ) {
    this.setupActions();
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  setupActions(): void {
    this.actions = [
      {
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-action btn-edit',
        handler: (row: Rol) => this.openEditModal(row),
        show: (row: Rol) => true
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-action btn-delete',
        handler: (row: Rol) => this.eliminarRol(row),
        show: (row: Rol) => true
      }
    ];
  }

  loadRoles(): void {
    this.loading = true;
    this.error = '';

    this.rolService.getRoles().subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.roles = response;
        } else if (response && 'data' in response) {
          this.roles = response.data;
        } else {
          this.roles = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los roles';
        this.loading = false;
        this.toastService.showError('Error', 'No se pudieron cargar los roles.');
        console.error('Error loading roles:', err);
      }
    });
  }

  // Abrir modal de creación
  openCreateModal(): void {
    this.createForm = {
      nombre_rol: '',
      descripcion: '',
      nivel_acceso: 1
    };
    this.showCreateModal = true;
  }

  // Crear nuevo rol
  createRol(): void {
    if (!this.createForm.nombre_rol || !this.createForm.nivel_acceso) {
      this.toastService.showWarn('Campos requeridos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    this.loading = true;
    this.rolService.createRol(this.createForm).subscribe({
      next: (rol) => {
        this.roles.push(rol);
        this.loading = false;
        this.showCreateModal = false;
        this.toastService.showSuccess('Rol creado', `El rol "${rol.nombre_rol}" se ha creado correctamente.`);
        this.loadRoles(); // Recargar para mantener orden
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message || 'No se pudo crear el rol.';
        this.toastService.showError('Error al crear', errorMessage);
      }
    });
  }

  // Abrir modal de edición
  openEditModal(rol: Rol): void {
    this.rolSeleccionado = rol;
    this.editForm = {
      nombre_rol: rol.nombre_rol,
      descripcion: rol.descripcion || '',
      nivel_acceso: rol.nivel_acceso
    };
    this.showEditModal = true;
  }

  // Guardar cambios de edición
  saveEdit(): void {
    if (!this.rolSeleccionado) return;

    this.loading = true;
    this.rolService.updateRol(this.rolSeleccionado.id_rol, this.editForm).subscribe({
      next: (rol) => {
        const index = this.roles.findIndex(r => r.id_rol === rol.id_rol);
        if (index !== -1) {
          this.roles[index] = rol;
        }
        this.loading = false;
        this.showEditModal = false;
        this.toastService.showSuccess('Rol actualizado', 'Los datos del rol se han actualizado correctamente.');
        this.loadRoles(); // Recargar para mantener orden
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message || 'No se pudo actualizar el rol.';
        this.toastService.showError('Error al actualizar', errorMessage);
      }
    });
  }

  // Eliminar rol
  eliminarRol(rol: Rol): void {
    this.confirmService.confirmDelete(
      () => {
        this.loading = true;
        this.rolService.deleteRol(rol.id_rol).subscribe({
          next: () => {
            this.roles = this.roles.filter(r => r.id_rol !== rol.id_rol);
            this.loading = false;
            this.toastService.showSuccess('Rol eliminado', `El rol "${rol.nombre_rol}" ha sido eliminado.`);
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo eliminar el rol.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar el rol "${rol.nombre_rol}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación de rol'
    );
  }

  // Cerrar modales
  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = {
      nombre_rol: '',
      descripcion: '',
      nivel_acceso: 1
    };
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.rolSeleccionado = undefined;
    this.editForm = {};
  }

  exportToCSV(): void {
    if (this.roles.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    const csvHeaders = ['ID', 'Nombre', 'Descripción', 'Nivel de Acceso'];
    const csvData = this.roles.map(r => ({
      'ID': r.id_rol,
      'Nombre': r.nombre_rol,
      'Descripción': r.descripcion || 'N/A',
      'Nivel de Acceso': r.nivel_acceso || 'N/A'
    }));

    this.exportService.exportToCSV(csvData, 'roles', csvHeaders);
    this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a CSV correctamente.');
  }

  async exportToPDF(): Promise<void> {
    if (this.roles.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    try {
      const pdfData = this.roles.map(r => ({
        'ID': r.id_rol,
        'Nombre': r.nombre_rol,
        'Descripción': r.descripcion || 'N/A',
        'Nivel de Acceso': r.nivel_acceso || 'N/A'
      }));

      await this.exportService.exportToPDF(
        pdfData,
        'roles',
        'Reporte de Roles',
        ['ID', 'Nombre', 'Descripción', 'Nivel de Acceso']
      );
      this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a PDF correctamente.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.toastService.showError('Error al exportar', 'No se pudo exportar a PDF. Por favor, intente nuevamente.');
    }
  }
}

