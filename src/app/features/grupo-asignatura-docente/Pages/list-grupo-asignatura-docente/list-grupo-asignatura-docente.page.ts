import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoConAsignaciones, GrupoAsignaturaDocente } from '../../models/grupo-asignatura-docente.model';

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
    private router: Router
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
    this.grupoAsignaturaDocenteService.remove(id).subscribe({
      next: () => {
        this.loadAsignaciones();
      },
      error: (error) => {
        this.error = 'Error al eliminar la asignación';
        console.error('Error deleting asignacion:', error);
      }
    });
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