import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoAsignaturaDocente } from '../../models/grupo-asignatura-docente.model';

@Component({
  selector: 'app-detail-grupo-asignatura-docente',
  standalone: false,
  templateUrl: './detail-grupo-asignatura-docente.page.html',
  styleUrls: ['./detail-grupo-asignatura-docente.page.css']
})
export class DetailGrupoAsignaturaDocentePage implements OnInit {
  asignacion?: GrupoAsignaturaDocente;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService
  ) {}

  ngOnInit(): void {
    this.loadAsignacion();
  }

  loadAsignacion(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (isNaN(id)) {
      this.error = 'ID de asignación no válido';
      return;
    }

    this.loading = true;
    this.error = null;

    this.grupoAsignaturaDocenteService.findOne(id).subscribe({
      next: (asignacion) => {
        console.log('Asignación cargada en detail:', asignacion);
        this.asignacion = asignacion;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error completo:', error);
        this.error = 'Error al cargar los detalles de la asignación: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.asignacion) {
      this.router.navigate(['/grupo-asignatura-docente', 'edit', this.asignacion.id_grupo_asignatura_docente]);
    }
  }

  onDelete(): void {
    if (this.asignacion && confirm('¿Está seguro de que desea eliminar esta asignación?')) {
      this.loading = true;
      this.grupoAsignaturaDocenteService.remove(this.asignacion.id_grupo_asignatura_docente).subscribe({
        next: () => {
          this.router.navigate(['/grupo-asignatura-docente']);
        },
        error: (error) => {
          this.loading = false;
          alert('Error al eliminar la asignación: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/grupo-asignatura-docente']);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'activa':
        return 'estado-activa';
      case 'finalizada':
        return 'estado-finalizada';
      case 'cancelada':
        return 'estado-cancelada';
      default:
        return 'estado-default';
    }
  }
}