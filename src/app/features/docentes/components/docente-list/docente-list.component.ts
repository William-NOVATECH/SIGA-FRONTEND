import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';
import { QueryDocenteDto } from '../../models/query-docente.model';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ExportService } from '../../../../core/services/export.service';
import { GrupoAsignaturaDocenteService } from '../../../grupo-asignatura-docente/services/grupo-asignatura-docente.service';

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
  asignacionesPorDocente: Map<number, number> = new Map(); // Map<id_docente, cantidad_asignaturas>

  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  constructor(
    private docenteService: DocenteService,
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private exportService: ExportService
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
        field: 'num_asignaturas', 
        header: 'Asignaturas Asignadas', 
        sortable: true, 
        width: '12%',
        template: 'badge',
        badgeClass: (value, row) => {
          const numAsignaturas = (row as any).num_asignaturas || 0;
          if (numAsignaturas === 0) return 'asignaturas-badge asignaturas-zero';
          if (numAsignaturas >= 5) return 'asignaturas-badge asignaturas-high';
          return 'asignaturas-badge asignaturas-normal';
        },
        format: (value, row) => {
          const numAsignaturas = (row as any).num_asignaturas || 0;
          return `${numAsignaturas} ${numAsignaturas === 1 ? 'asignatura' : 'asignaturas'}`;
        }
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

        // Inicializar num_asignaturas en 0 para cada docente
        this.docentes = docentesRaw.map(docente => {
          (docente as any).num_asignaturas = 0;
          return docente;
        });
        
        // Cargar asignaciones de todos los docentes
        this.loadAsignacionesDocentes();
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

  loadAsignacionesDocentes(): void {
    if (this.docentes.length === 0) {
      this.loading = false;
      return;
    }

    // Crear observables para obtener asignaciones de cada docente
    const observables = this.docentes.map(docente => 
      this.grupoAsignaturaDocenteService.findByDocente(docente.id_docente).pipe(
        map((asignaciones: any) => {
          const asignacionesArray = Array.isArray(asignaciones) ? asignaciones : [];
          // Contar solo asignaciones activas
          const asignacionesActivas = asignacionesArray.filter(
            (a: any) => a.estado === 'activa'
          ).length;
          return { idDocente: docente.id_docente, cantidad: asignacionesActivas };
        }),
        catchError((error) => {
          console.error(`Error cargando asignaciones del docente ${docente.id_docente}:`, error);
          return of({ idDocente: docente.id_docente, cantidad: 0 });
        })
      )
    );

    // Ejecutar todas las peticiones en paralelo
    forkJoin(observables).subscribe({
      next: (resultados) => {
        // Guardar el conteo de asignaturas por docente y agregar la propiedad al objeto docente
        resultados.forEach(resultado => {
          this.asignacionesPorDocente.set(resultado.idDocente, resultado.cantidad);
          // Agregar la propiedad num_asignaturas directamente al docente para que el formato funcione
          const docente = this.docentes.find(d => d.id_docente === resultado.idDocente);
          if (docente) {
            (docente as any).num_asignaturas = resultado.cantidad;
          }
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando asignaciones de docentes:', err);
        // Inicializar con 0 si falla la carga
        this.docentes.forEach(docente => {
          (docente as any).num_asignaturas = 0;
        });
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

  exportToCSV(): void {
    if (this.docentes.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    const csvHeaders = ['ID', 'Código', 'Nombres', 'Apellidos', 'Asignaturas Asignadas', 'Departamento', 'Cargo', 'Estado'];
    const csvData = this.docentes.map(d => ({
      'ID': d.id_docente,
      'Código': d.codigo_docente || 'N/A',
      'Nombres': d.nombres || 'N/A',
      'Apellidos': d.apellidos || 'N/A',
      'Asignaturas Asignadas': this.asignacionesPorDocente.get(d.id_docente) || 0,
      'Departamento': d.departamento?.nombre_departamento || 'N/A',
      'Cargo': d.cargo?.nombre_cargo || 'N/A',
      'Estado': d.estado || 'N/A'
    }));

    this.exportService.exportToCSV(csvData, 'docentes', csvHeaders);
    this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a CSV correctamente.');
  }

  async exportToPDF(): Promise<void> {
    if (this.docentes.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    try {
      const pdfData = this.docentes.map(d => ({
        'Código': d.codigo_docente || 'N/A',
        'Nombres': d.nombres || 'N/A',
        'Apellidos': d.apellidos || 'N/A',
        'Asignaturas Asignadas': this.asignacionesPorDocente.get(d.id_docente) || 0,
        'Departamento': d.departamento?.nombre_departamento || 'N/A',
        'Cargo': d.cargo?.nombre_cargo || 'N/A',
        'Estado': d.estado || 'N/A'
      }));

      await this.exportService.exportToPDF(
        pdfData,
        'docentes',
        'Reporte de Docentes',
        ['Código', 'Nombres', 'Apellidos', 'Asignaturas Asignadas', 'Departamento', 'Cargo', 'Estado']
      );
      this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a PDF correctamente.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.toastService.showError('Error al exportar', 'No se pudo exportar a PDF. Por favor, intente nuevamente.');
    }
  }
}