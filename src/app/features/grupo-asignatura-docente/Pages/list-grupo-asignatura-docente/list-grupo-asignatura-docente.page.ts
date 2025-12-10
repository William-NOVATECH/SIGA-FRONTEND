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
  gruposFiltrados: GrupoConAsignaciones[] = []; // Grupos filtrados
  asignaciones: GrupoAsignaturaDocente[] = []; // Lista aplanada de todas las asignaciones
  loading: boolean = false;
  error: string | null = null;

  // Filtros
  filtroCarrera: string = '';
  filtroDocente: string = '';
  filtroGrupo: string = '';
  filtroAsignatura: string = '';

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
        this.aplicarFiltros();
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

  getTotalAsignaciones(): number {
    return this.gruposFiltrados.reduce((total, grupo) => total + grupo.asignaciones.length, 0);
  }

  // Métodos para obtener opciones únicas de filtros
  getCarrerasUnicas(): string[] {
    const carreras = new Set<string>();
    this.grupos.forEach(grupo => {
      if (grupo.carrera?.nombre_carrera && grupo.carrera.nombre_carrera !== 'Carrera no especificada') {
        carreras.add(grupo.carrera.nombre_carrera);
      }
    });
    return Array.from(carreras).sort();
  }

  getDocentesUnicos(): string[] {
    const docentes = new Set<string>();
    this.grupos.forEach(grupo => {
      grupo.asignaciones.forEach(asignacion => {
        if (asignacion.docente?.nombres && asignacion.docente?.apellidos) {
          const nombreCompleto = `${asignacion.docente.nombres} ${asignacion.docente.apellidos}`.trim();
          if (nombreCompleto && nombreCompleto !== 'N/A') {
            docentes.add(nombreCompleto);
          }
        }
      });
    });
    return Array.from(docentes).sort();
  }

  getGruposUnicos(): string[] {
    const grupos = new Set<string>();
    this.grupos.forEach(grupo => {
      const nombreGrupo = grupo.nombre_grupo || grupo.codigo_grupo || '';
      if (nombreGrupo) {
        grupos.add(nombreGrupo);
      }
    });
    return Array.from(grupos).sort();
  }

  getAsignaturasUnicas(): string[] {
    const asignaturas = new Set<string>();
    this.grupos.forEach(grupo => {
      grupo.asignaciones.forEach(asignacion => {
        if (asignacion.asignatura?.nombre_asignatura && asignacion.asignatura.nombre_asignatura !== 'N/A') {
          asignaturas.add(asignacion.asignatura.nombre_asignatura);
        }
      });
    });
    return Array.from(asignaturas).sort();
  }

  // Aplicar filtros
  aplicarFiltros(): void {
    this.gruposFiltrados = this.grupos.map(grupo => {
      // Filtrar asignaciones dentro del grupo
      const asignacionesFiltradas = grupo.asignaciones.filter(asignacion => {
        // Filtro por carrera
        if (this.filtroCarrera) {
          const carreraNombre = grupo.carrera?.nombre_carrera || '';
          if (carreraNombre !== this.filtroCarrera || carreraNombre === 'Carrera no especificada') {
            return false;
          }
        }

        // Filtro por docente
        if (this.filtroDocente) {
          const nombreDocente = `${asignacion.docente?.nombres || ''} ${asignacion.docente?.apellidos || ''}`.trim();
          if (nombreDocente !== this.filtroDocente) {
            return false;
          }
        }

        // Filtro por asignatura
        if (this.filtroAsignatura) {
          const nombreAsignatura = asignacion.asignatura?.nombre_asignatura || '';
          if (nombreAsignatura !== this.filtroAsignatura) {
            return false;
          }
        }

        return true;
      });

      // Retornar grupo solo si tiene asignaciones filtradas o si no hay filtro de grupo
      if (asignacionesFiltradas.length === 0 && (this.filtroCarrera || this.filtroDocente || this.filtroAsignatura)) {
        return null; // Este grupo no pasa los filtros
      }

      // Filtro por grupo
      if (this.filtroGrupo) {
        const nombreGrupo = grupo.nombre_grupo || grupo.codigo_grupo || '';
        if (nombreGrupo !== this.filtroGrupo) {
          return null;
        }
      }

      return {
        ...grupo,
        asignaciones: asignacionesFiltradas
      };
    }).filter(grupo => grupo !== null) as GrupoConAsignaciones[];

    // Actualizar asignaciones aplanadas con los filtros aplicados
    this.asignaciones = this.gruposFiltrados.flatMap(grupo => 
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
  }

  // Métodos para cambiar filtros
  onFiltroCarreraChange(carrera: string): void {
    this.filtroCarrera = carrera;
    this.aplicarFiltros();
  }

  onFiltroDocenteChange(docente: string): void {
    this.filtroDocente = docente;
    this.aplicarFiltros();
  }

  onFiltroGrupoChange(grupo: string): void {
    this.filtroGrupo = grupo;
    this.aplicarFiltros();
  }

  onFiltroAsignaturaChange(asignatura: string): void {
    this.filtroAsignatura = asignatura;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroCarrera = '';
    this.filtroDocente = '';
    this.filtroGrupo = '';
    this.filtroAsignatura = '';
    this.aplicarFiltros();
  }

  tieneFiltrosActivos(): boolean {
    return !!(this.filtroCarrera || this.filtroDocente || this.filtroGrupo || this.filtroAsignatura);
  }
}