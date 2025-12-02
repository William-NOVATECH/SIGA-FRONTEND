import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CargaDocenteService } from '../../services/carga-docente.service';
import { CreateCargaDocente, UpdateCargaDocente } from '../../interfaces/create-carga-docente.interface';
import { CargaDocenteWithRelations } from '../../models/carga-docente.model';

@Component({
  selector: 'app-manage-page',
  templateUrl: './manage-page.component.html'
})
export class ManagePageComponent implements OnInit {
  mode: 'create' | 'edit' | 'view' = 'create';
  carga?: CargaDocenteWithRelations;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cargaDocenteService: CargaDocenteService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.routeConfig?.path;

    if (path?.includes('editar')) {
      this.mode = 'edit';
      this.loadCarga(Number(id));
    } else if (path?.includes('detalles')) {
      this.mode = 'view';
      this.loadCarga(Number(id));
    } else {
      this.mode = 'create';
    }
  }

  loadCarga(id: number): void {
    this.loading = true;
    this.cargaDocenteService.findOne(id).subscribe({
      next: (carga) => {
        this.carga = carga;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar carga docente:', error);
        this.loading = false;
        alert('Error al cargar la carga docente');
        this.router.navigate(['/carga-docente']);
      }
    });
  }

  onSubmitForm(data: CreateCargaDocente | UpdateCargaDocente): void {
    this.loading = true;

    if (this.mode === 'create') {
      this.cargaDocenteService.create(data as CreateCargaDocente).subscribe({
        next: () => {
          this.loading = false;
          alert('Carga docente creada correctamente');
          this.router.navigate(['/carga-docente']);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al crear:', error);
          alert('Error al crear la carga docente: ' + (error.error?.message || error.message));
        }
      });
    } else if (this.mode === 'edit' && this.carga) {
      this.cargaDocenteService.update(this.carga.id_carga, data).subscribe({
        next: () => {
          this.loading = false;
          alert('Carga docente actualizada correctamente');
          this.router.navigate(['/carga-docente']);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al actualizar:', error);
          alert('Error al actualizar la carga docente: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/carga-docente']);
  }

  getPageTitle(): string {
    switch (this.mode) {
      case 'create': return 'Nueva Carga Docente';
      case 'edit': return 'Editar Carga Docente';
      case 'view': return 'Detalles de Carga Docente';
      default: return 'Carga Docente';
    }
  }
}