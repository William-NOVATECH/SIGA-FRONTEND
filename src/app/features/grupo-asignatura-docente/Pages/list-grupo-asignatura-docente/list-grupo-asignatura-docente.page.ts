import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GrupoAsignaturaDocenteGroupedListComponent } from '../../grupo-asignatura-docente-grouped-list/grupo-asignatura-docente-grouped-list.component';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoConAsignaciones } from '../../models/grupo-asignatura-docente.model';

@Component({
  selector: 'app-list-grupo-asignatura-docente',
  standalone: true,
  imports: [CommonModule, GrupoAsignaturaDocenteGroupedListComponent],
  templateUrl: './list-grupo-asignatura-docente.page.html',
  styleUrls: ['./list-grupo-asignatura-docente.page.css']
})
export class ListGrupoAsignaturaDocentePage implements OnInit {
onViewGrupo($event: number) {
throw new Error('Method not implemented.');
}
  grupos: GrupoConAsignaciones[] = [];
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
}