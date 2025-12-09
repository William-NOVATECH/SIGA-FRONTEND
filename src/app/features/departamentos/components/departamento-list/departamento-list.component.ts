import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartamentoService } from '../../services/departamento.service';
import { Departamento, QueryDepartamento, DepartamentoResponse } from '../../models/departamento.model';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ExportService } from '../../../../core/services/export.service';

@Component({
  selector: 'app-departamento-list',
  standalone: false,
  templateUrl: './departamento-list.component.html',
  styleUrls: ['./departamento-list.component.css']
})
export class DepartamentoListComponent implements OnInit {
  departamentos: Departamento[] = [];
  filterForm: FormGroup;
  loading = false;

  // Configuración de columnas para la tabla
  columns: TableColumn[] = [
    {
      field: 'id_departamento',
      header: 'ID',
      sortable: true,
      width: '80px',
      template: 'badge',
      format: (value) => `#${value}`
    },
    {
      field: 'nombre_departamento',
      header: 'Departamento',
      sortable: true
    },
    {
      field: 'codigo_departamento',
      header: 'Código',
      sortable: true,
      template: 'badge'
    },
    {
      field: 'estado',
      header: 'Estado',
      sortable: true,
      template: 'status',
      badgeClass: (value) => value === 'activo' ? 'status-active' : 'status-inactive',
      format: (value) => value === 'activo' ? 'Activo' : 'Inactivo'
    }
  ];

  // Configuración de acciones
  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'fa-edit',
      class: 'btn-edit',
      handler: (row) => this.editDepartamento(row.id_departamento)
    },
    {
      label: 'Eliminar',
      icon: 'fa-trash',
      class: 'btn-delete',
      handler: (row) => this.deleteDepartamento(row.id_departamento)
    }
  ];

  constructor(
    private departamentoService: DepartamentoService,
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private exportService: ExportService
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
      this.loadDepartamentos();
    });
  }

  loadDepartamentos() {
    this.loading = true;
    const query: QueryDepartamento = {
      ...this.filterForm.value
    };

    // Limpiar valores vacíos
    Object.keys(query).forEach(key => {
      if (!query[key as keyof QueryDepartamento]) {
        delete query[key as keyof QueryDepartamento];
      }
    });

    // Remover paginación para obtener todos los datos
    delete query.page;
    delete query.limit;

    this.departamentoService.findAll(query).subscribe({
      next: (response) => {
        if (this.isPaginatedResponse(response)) {
          this.departamentos = response.data;
        } else {
          this.departamentos = response;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading departamentos:', error);
        this.loading = false;
        this.toastService.showError(
          'Error al cargar',
          'No se pudieron cargar los departamentos. Por favor, intente nuevamente.'
        );
      }
    });
  }

  private isPaginatedResponse(response: any): response is DepartamentoResponse {
    return response && typeof response === 'object' && 'data' in response && 'total' in response;
  }

  editDepartamento(id: number) {
    this.router.navigate(['/departamentos/editar', id]);
  }

  createDepartamento() {
    this.router.navigate(['/departamentos/crear']);
  }

  deleteDepartamento(id: number) {
    this.confirmService.confirmDelete(
      () => {
        this.departamentoService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess(
              'Departamento eliminado',
              'El departamento se ha eliminado correctamente.'
            );
            this.loadDepartamentos();
          },
          error: (error) => {
            console.error('Error deleting departamento:', error);
            const errorMessage = error?.error?.message || 'No se pudo eliminar el departamento. Por favor, intente nuevamente.';
            this.toastService.showError(
              'Error al eliminar',
              errorMessage
            );
          }
        });
      },
      '¿Estás seguro de que deseas eliminar este departamento? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      estado: '',
      orderBy: 'nombre_departamento',
      orderDirection: 'ASC'
    });
  }

  exportToCSV(): void {
    if (this.departamentos.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    const csvHeaders = ['ID', 'Nombre', 'Código', 'Estado'];
    const csvData = this.departamentos.map(d => ({
      'ID': d.id_departamento,
      'Nombre': d.nombre_departamento,
      'Código': d.codigo_departamento || 'N/A',
      'Estado': d.estado || 'N/A'
    }));

    this.exportService.exportToCSV(csvData, 'departamentos', csvHeaders);
    this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a CSV correctamente.');
  }

  async exportToPDF(): Promise<void> {
    if (this.departamentos.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    try {
      const pdfData = this.departamentos.map(d => ({
        'ID': d.id_departamento,
        'Nombre': d.nombre_departamento,
        'Código': d.codigo_departamento || 'N/A',
        'Estado': d.estado || 'N/A'
      }));

      await this.exportService.exportToPDF(
        pdfData,
        'departamentos',
        'Reporte de Departamentos',
        ['ID', 'Nombre', 'Código', 'Estado']
      );
      this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a PDF correctamente.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.toastService.showError('Error al exportar', 'No se pudo exportar a PDF. Por favor, intente nuevamente.');
    }
  }

}