import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CargaDocenteService } from '../../services/carga-docente.service';
import { CargaDocenteWithRelations } from '../../models/carga-docente.model';

@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html'
})
export class ListPageComponent implements OnInit {
  selectedCarga?: CargaDocenteWithRelations;
  viewMode: 'list' | 'details' = 'list';

  constructor(
    private router: Router,
    private cargaDocenteService: CargaDocenteService
  ) {}

  ngOnInit(): void {}

  onEdit(id: number): void {
    this.router.navigate(['/carga-docente/editar', id]);
  }

onView(id: number): void {
  this.cargaDocenteService.findOne(id).subscribe({
    next: (carga) => {
      // Si no vienen las relaciones, cargarlas manualmente
      if (!carga.docente || !carga.grupo) {
        this.cargaDocenteService.loadRelationsForCarga(carga).subscribe({
          next: (cargaWithRelations) => {
            this.selectedCarga = cargaWithRelations;
            this.viewMode = 'details';
          },
          error: (error) => {
            console.error('Error al cargar relaciones:', error);
            // Mostrar igual sin relaciones
            this.selectedCarga = carga;
            this.viewMode = 'details';
          }
        });
      } else {
        this.selectedCarga = carga;
        this.viewMode = 'details';
      }
    },
    error: (error) => {
      console.error('Error al cargar detalles:', error);
      alert('Error al cargar los detalles de la carga docente');
    }
  });
}

  onDelete(id: number): void {
    this.cargaDocenteService.remove(id).subscribe({
      next: () => {
        alert('Carga docente eliminada correctamente');
        // Recargar la lista si es necesario
        window.location.reload();
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la carga docente');
      }
    });
  }

  onNewCarga(): void {
    this.router.navigate(['/carga-docente/nuevo']);
  }

  onBackToList(): void {
    this.viewMode = 'list';
    this.selectedCarga = undefined;
  }
}