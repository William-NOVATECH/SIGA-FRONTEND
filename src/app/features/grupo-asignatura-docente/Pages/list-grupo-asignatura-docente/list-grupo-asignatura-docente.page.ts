import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoConAsignaciones, GrupoAsignaturaDocente } from '../../models/grupo-asignatura-docente.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ExportService } from '../../../../core/services/export.service';

@Component({
  selector: 'app-list-grupo-asignatura-docente',
  standalone: false,
  templateUrl: './list-grupo-asignatura-docente.page.html',
  styleUrls: ['./list-grupo-asignatura-docente.page.css']
})
export class ListGrupoAsignaturaDocentePage implements OnInit {
  grupos: GrupoConAsignaciones[] = [];
  asignaciones: GrupoAsignaturaDocente[] = []; // Lista aplanada de todas las asignaciones
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadAsignaciones();
  }

  loadAsignaciones(): void {
    this.loading = true;
    this.error = null;

    this.grupoAsignaturaDocenteService.getAsignacionesAgrupadas().subscribe({
      next: (grupos) => {
        this.grupos = grupos;
        // Aplanar todas las asignaciones de todos los grupos y convertir a GrupoAsignaturaDocente
        this.asignaciones = grupos.flatMap(grupo => 
          grupo.asignaciones.map(asignacion => ({
            id_grupo_asignatura_docente: asignacion.id_grupo_asignatura_docente,
            id_grupo: grupo.id_grupo,
            id_asignatura: asignacion.asignatura?.id_asignatura || 0,
            id_docente: asignacion.docente?.id_docente || 0,
            fecha_asignacion: asignacion.fecha_asignacion,
            estado: asignacion.estado || 'activa',
            observaciones: asignacion.observaciones,
            estado_aprobacion: asignacion.estado_aprobacion,
            version_actual: asignacion.version_actual,
            grupo: {
              id_grupo: grupo.id_grupo,
              codigo_grupo: grupo.codigo_grupo,
              nombre_grupo: grupo.nombre_grupo,
              carrera: grupo.carrera
            },
            asignatura: asignacion.asignatura || { id_asignatura: 0, nombre_asignatura: 'N/A' },
            docente: asignacion.docente || { id_docente: 0, nombres: 'N/A', apellidos: '' }
          } as GrupoAsignaturaDocente))
        );
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las asignaciones';
        this.loading = false;
        console.error('Error loading asignaciones agrupadas:', error);
      }
    });
  }

  onEdit(id: number): void {
    this.router.navigate(['/grupo-asignatura-docente', 'edit', id]);
  }

  onDelete(id: number): void {
    const asignacion = this.asignaciones.find(a => a.id_grupo_asignatura_docente === id);
    const asignacionNombre = asignacion 
      ? `${asignacion.asignatura?.nombre_asignatura || 'Asignación'} - ${asignacion.docente?.nombres || ''} ${asignacion.docente?.apellidos || ''}`
      : 'esta asignación';

    this.confirmService.confirmDelete(
      () => {
        this.grupoAsignaturaDocenteService.remove(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Asignación eliminada', `La asignación se ha eliminado correctamente.`);
            this.loadAsignaciones();
          },
          error: (error) => {
            console.error('Error deleting asignacion:', error);
            const errorMessage = error?.error?.message || 'No se pudo eliminar la asignación. Por favor, intente nuevamente.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar ${asignacionNombre}? Esta acción no se puede deshacer.`,
      'Confirmar eliminación'
    );
  }

  exportToCSV(): void {
    if (this.asignaciones.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    const csvHeaders = ['ID', 'Código Grupo', 'Nombre Grupo', 'Carrera', 'Asignatura', 'Código Asignatura', 'Docente', 'Código Docente', 'Fecha Asignación', 'Estado', 'Estado Aprobación', 'Versión', 'Observaciones'];
    const csvData = this.asignaciones.map(a => ({
      'ID': a.id_grupo_asignatura_docente,
      'Código Grupo': a.grupo?.codigo_grupo || 'N/A',
      'Nombre Grupo': a.grupo?.nombre_grupo || 'N/A',
      'Carrera': a.grupo?.carrera?.nombre_carrera || 'N/A',
      'Asignatura': a.asignatura?.nombre_asignatura || 'N/A',
      'Código Asignatura': a.asignatura?.codigo_asignatura || 'N/A',
      'Docente': `${a.docente?.nombres || ''} ${a.docente?.apellidos || ''}`.trim() || 'N/A',
      'Código Docente': a.docente?.codigo_docente || 'N/A',
      'Fecha Asignación': this.formatDate(a.fecha_asignacion),
      'Estado': a.estado || 'N/A',
      'Estado Aprobación': this.getEstadoAprobacionDisplay(a.estado_aprobacion),
      'Versión': a.version_actual || 'N/A',
      'Observaciones': a.observaciones || 'N/A'
    }));

    this.exportService.exportToCSV(csvData, 'carga_docente', csvHeaders);
    this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a CSV correctamente.');
  }

  async exportToPDF(): Promise<void> {
    if (this.asignaciones.length === 0) {
      this.toastService.showError('Sin datos', 'No hay datos para exportar.');
      return;
    }

    try {
      const pdfData = this.asignaciones.map(a => ({
        'Grupo': `${a.grupo?.codigo_grupo || 'N/A'} - ${a.grupo?.nombre_grupo || 'N/A'}`,
        'Carrera': a.grupo?.carrera?.nombre_carrera || 'N/A',
        'Asignatura': a.asignatura?.nombre_asignatura || 'N/A',
        'Docente': `${a.docente?.nombres || ''} ${a.docente?.apellidos || ''}`.trim() || 'N/A',
        'Fecha': this.formatDate(a.fecha_asignacion),
        'Estado': a.estado || 'N/A',
        'Aprobación': this.getEstadoAprobacionDisplay(a.estado_aprobacion)
      }));

      await this.exportService.exportToPDF(
        pdfData,
        'carga_docente',
        'Reporte de Carga Docente',
        ['Grupo', 'Carrera', 'Asignatura', 'Docente', 'Fecha', 'Estado', 'Aprobación']
      );
      this.toastService.showSuccess('Exportación exitosa', 'Los datos se han exportado a PDF correctamente.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.toastService.showError('Error al exportar', 'No se pudo exportar a PDF. Por favor, intente nuevamente.');
    }
  }

  onView(id: number): void {
    this.router.navigate(['/grupo-asignatura-docente', 'detail', id]);
  }

  onRefresh(): void {
    this.loadAsignaciones();
  }

  onCreateNew(): void {
    this.router.navigate(['/grupo-asignatura-docente', 'create']);
  }

  onCreateBulk(): void {
    this.router.navigate(['/grupo-asignatura-docente', 'bulk-create']);
  }

  onCreateAsignacion(idGrupo: number): void {
    // Navegar al formulario de creación pre-seleccionando el grupo
    this.router.navigate(['/grupo-asignatura-docente', 'create'], {
      queryParams: { grupo: idGrupo }
    });
  }

  onViewGrupo(idGrupo: number): void {
    // Navegar a la vista del grupo
    this.router.navigate(['/grupos', 'detail', idGrupo]);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  }

  getEstadoAprobacionDisplay(estado?: string): string {
    if (!estado) return 'Sin versionamiento';
    const estados: { [key: string]: string } = {
      'borrador': 'Borrador',
      'pendiente_revision': 'Pendiente Revisión',
      'revisada': 'Revisada',
      'pendiente_aprobacion': 'Pendiente Aprobación',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada'
    };
    return estados[estado] || estado;
  }
}