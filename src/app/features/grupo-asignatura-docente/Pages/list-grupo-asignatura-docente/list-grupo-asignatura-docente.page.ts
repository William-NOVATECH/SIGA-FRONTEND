import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoConAsignaciones, GrupoAsignaturaDocente, Grupo } from '../../models/grupo-asignatura-docente.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ExportService } from '../../../../core/services/export.service';
import { AuthService } from '../../../../core/services/auth.service';
import { GrupoService } from '../../services/grupo.service';
import { CarreraService } from '../../../carreras/services/carrera.service';
import { DepartamentoService } from '../../../carreras/services/departamento.service';

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

  // Pestañas
  activeTab: 'con-carga' | 'sin-carga' = 'con-carga';

  // Grupos sin asignaciones
  gruposSinAsignaciones: Grupo[] = [];
  gruposSinAsignacionesFiltrados: Grupo[] = [];
  loadingGruposSinAsignaciones: boolean = false;

  // Información del usuario y roles
  isCoordinador: boolean = false;
  isJefe: boolean = false;
  isDirector: boolean = false;
  carreraCoordinador: any = null;

  // Filtros
  filtroCarrera: string = '';
  filtroDocente: string = '';
  filtroGrupo: string = '';
  filtroAsignatura: string = '';
  filtroDepartamento: string = '';
  
  // Departamentos y carreras completas
  departamentos: any[] = [];
  carrerasCompletas: Map<number, any> = new Map(); // Map<id_carrera, carrera_completa>

  constructor(
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService,
    private grupoService: GrupoService,
    private authService: AuthService,
    private carreraService: CarreraService,
    private departamentoService: DepartamentoService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadUserRoles();
    this.loadDepartamentos();
    this.loadAsignaciones();
  }

  loadUserRoles(): void {
    this.authService.getActiveRoleId().subscribe({
      next: (roleId) => {
        this.isCoordinador = roleId === 2;
        this.isJefe = roleId === 1;
        this.isDirector = roleId === 5;
        
        if (this.isCoordinador) {
          this.loadCarreraCoordinador();
        }
      },
      error: (error) => {
        console.error('Error obteniendo rol del usuario:', error);
      }
    });
  }

  loadCarreraCoordinador(): void {
    const userId = this.authService.getUserIdFromToken();
    if (!userId) {
      return;
    }

    this.carreraService.findAll().subscribe({
      next: (response: any) => {
        const carrerasArray = Array.isArray(response.data) ? response.data : [response.data];
        this.carreraCoordinador = carrerasArray.find((carrera: any) => 
          carrera.coordinador && carrera.coordinador.id_usuario === userId
        );
        // Si ya hay grupos cargados, filtrarlos nuevamente
        if (this.gruposSinAsignaciones.length > 0) {
          this.filtrarGruposSinAsignacionesPorRol();
        }
      },
      error: (error) => {
        console.error('Error obteniendo carrera del coordinador:', error);
      }
    });
  }

  loadDepartamentos(): void {
    this.departamentoService.findAllActive().subscribe({
      next: (departamentos) => {
        this.departamentos = Array.isArray(departamentos) ? departamentos : [];
      },
      error: (error) => {
        console.error('Error cargando departamentos:', error);
        this.departamentos = [];
      }
    });
  }

  loadAsignaciones(): void {
    this.loading = true;
    this.error = null;

    this.grupoAsignaturaDocenteService.getAsignacionesAgrupadas().subscribe({
      next: (grupos) => {
        this.grupos = grupos;
        
        // Cargar información completa de carreras para obtener departamentos
        this.loadCarrerasCompletas(grupos);
        
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

  loadCarrerasCompletas(grupos: GrupoConAsignaciones[]): void {
    // Obtener IDs únicos de carreras
    const carreraIds = new Set<number>();
    grupos.forEach(grupo => {
      if (grupo.carrera?.id_carrera) {
        carreraIds.add(grupo.carrera.id_carrera);
      }
    });

    if (carreraIds.size === 0) {
      return;
    }

    // Cargar información completa de cada carrera
    const observables = Array.from(carreraIds).map(idCarrera =>
      this.carreraService.findOne(idCarrera).pipe(
        map((response: any) => {
          // Manejar diferentes formatos de respuesta
          let carrera = null;
          if (response && response.data) {
            carrera = Array.isArray(response.data) ? response.data[0] : response.data;
          } else if (response && !response.data) {
            carrera = Array.isArray(response) ? response[0] : response;
          }
          return { idCarrera, carrera };
        })
      )
    );

    forkJoin(observables).subscribe({
      next: (resultados) => {
        resultados.forEach(({ idCarrera, carrera }) => {
          if (carrera) {
            this.carrerasCompletas.set(idCarrera, carrera);
          }
        });
        // Re-aplicar filtros después de cargar las carreras
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Error cargando carreras completas:', error);
        // Continuar sin las carreras completas, el filtro simplemente no funcionará hasta que se carguen
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

  // Métodos para pestañas
  switchTab(tab: 'con-carga' | 'sin-carga'): void {
    this.activeTab = tab;
    if (tab === 'sin-carga' && this.gruposSinAsignaciones.length === 0) {
      this.loadGruposSinAsignaciones();
    }
  }

  loadGruposSinAsignaciones(): void {
    this.loadingGruposSinAsignaciones = true;
    this.error = null;

    this.grupoAsignaturaDocenteService.getGruposSinAsignaciones().subscribe({
      next: (grupos) => {
        this.gruposSinAsignaciones = grupos;
        this.filtrarGruposSinAsignacionesPorRol();
        this.loadingGruposSinAsignaciones = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los grupos sin asignaciones';
        this.loadingGruposSinAsignaciones = false;
        console.error('Error loading grupos sin asignaciones:', error);
      }
    });
  }

  filtrarGruposSinAsignacionesPorRol(): void {
    if (this.isCoordinador && this.carreraCoordinador) {
      // Filtrar solo grupos de la carrera del coordinador
      this.gruposSinAsignacionesFiltrados = this.gruposSinAsignaciones.filter(grupo => {
        const grupoCarreraId = grupo.carrera?.id_carrera;
        return grupoCarreraId === this.carreraCoordinador.id_carrera;
      });
    } else if (this.isJefe || this.isDirector) {
      // Mostrar todos los grupos sin restricción
      this.gruposSinAsignacionesFiltrados = this.gruposSinAsignaciones;
    } else {
      // Si no es coordinador, jefe o director, no mostrar grupos
      this.gruposSinAsignacionesFiltrados = [];
    }
  }

  onAsignarDocente(idGrupo: number): void {
    // Navegar al formulario de asignación masiva pre-seleccionando el grupo
    this.router.navigate(['/grupo-asignatura-docente', 'bulk-create'], {
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

  getDepartamentosUnicos(): string[] {
    const departamentos = new Set<string>();
    this.grupos.forEach(grupo => {
      if (grupo.carrera?.id_carrera) {
        const carreraCompleta = this.carrerasCompletas.get(grupo.carrera.id_carrera);
        if (carreraCompleta?.departamento?.nombre_departamento) {
          departamentos.add(carreraCompleta.departamento.nombre_departamento);
        }
      }
    });
    return Array.from(departamentos).sort();
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
      // Filtro por departamento (a nivel de grupo/carrera)
      if (this.filtroDepartamento) {
        if (grupo.carrera?.id_carrera) {
          const carreraCompleta = this.carrerasCompletas.get(grupo.carrera.id_carrera);
          const nombreDepartamento = carreraCompleta?.departamento?.nombre_departamento || '';
          if (nombreDepartamento !== this.filtroDepartamento) {
            return null; // Este grupo no pertenece al departamento seleccionado
          }
        } else {
          return null; // No hay información de carrera/departamento
        }
      }

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

  onFiltroDepartamentoChange(departamento: string): void {
    this.filtroDepartamento = departamento;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroCarrera = '';
    this.filtroDocente = '';
    this.filtroGrupo = '';
    this.filtroAsignatura = '';
    this.filtroDepartamento = '';
    this.aplicarFiltros();
  }

  tieneFiltrosActivos(): boolean {
    return !!(this.filtroCarrera || this.filtroDocente || this.filtroGrupo || this.filtroAsignatura || this.filtroDepartamento);
  }
}