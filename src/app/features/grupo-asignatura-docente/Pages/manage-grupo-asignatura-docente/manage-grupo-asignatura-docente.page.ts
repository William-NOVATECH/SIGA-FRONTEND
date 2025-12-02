import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoAsignaturaDocenteFormComponent } from '../../grupo-asignatura-docente-form/grupo-asignatura-docente-form.component';
import { GrupoAsignaturaDocenteBulkFormComponent } from '../../grupo-asignatura-docente-bulk-form/grupo-asignatura-docente-bulk-form.component';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoService } from '../../services/grupo.service';
import { AsignaturaService } from '../../services/asignatura.service';
import { DocenteService } from '../../services/docente.service';
import { CreateGrupoAsignaturaDocente } from '../../models/create-grupo-asignatura-docente.model';
import { CreateBulkGrupoAsignaturaDocente } from '../../models/create-bulk-grupo-asignatura-docente.model';
import { BulkCreateResponse, GrupoAsignaturaDocente } from '../../models/grupo-asignatura-docente.model';

@Component({
  selector: 'app-manage-grupo-asignatura-docente',
  standalone: true,
  imports: [CommonModule, GrupoAsignaturaDocenteFormComponent, GrupoAsignaturaDocenteBulkFormComponent],
  templateUrl: './manage-grupo-asignatura-docente.page.html',
  styleUrls: ['./manage-grupo-asignatura-docente.page.css']
})
export class ManageGrupoAsignaturaDocentePage implements OnInit {
  mode: 'create' | 'edit' | 'bulk-create' = 'create';
  asignacion?: GrupoAsignaturaDocente;
  loading: boolean = false;
  loadingData: boolean = false;
  
  grupos: any[] = [];
  asignaturas: any[] = [];
  docentes: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService,
    private grupoService: GrupoService,
    private asignaturaService: AsignaturaService,
    private docenteService: DocenteService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.mode = 'edit';
        this.loadAsignacion(Number(params['id']));
      } else if (this.route.snapshot.url[0]?.path === 'bulk-create') {
        this.mode = 'bulk-create';
      } else {
        this.mode = 'create';
      }
    });

    this.loadSelectData();
  }

  loadAsignacion(id: number): void {
    this.loading = true;
    this.grupoAsignaturaDocenteService.findOne(id).subscribe({
      next: (asignacion) => {
        this.asignacion = asignacion;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading asignacion:', error);
        this.loading = false;
        this.router.navigate(['/grupo-asignatura-docente']);
      }
    });
  }

  loadSelectData(): void {
    this.loadingData = true;

    // Cargar docentes primero
    this.loadDocentes();
  }

 private loadDocentes(): void {
  this.docenteService.findAll().subscribe({
    next: (docentes) => {
      console.log('Docentes cargados:', docentes);
      // Normalizar la estructura de datos para los docentes
      this.docentes = docentes.map(docente => ({
        id_docente: docente.id_docente,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        nombre: `${docente.nombres} ${docente.apellidos}`, // Propiedad adicional para display
        codigo_docente: docente.codigo_docente
      }));
      console.log('Docentes normalizados:', this.docentes);
      this.loadGrupos();
    },
    error: (error) => {
      console.error('Error cargando docentes:', error);
      // Datos de ejemplo normalizados
      this.docentes = [
        { 
          id_docente: 1, 
          nombres: 'Juan', 
          apellidos: 'Pérez', 
          nombre: 'Juan Pérez',
          codigo_docente: 'DOC001' 
        },
        { 
          id_docente: 2, 
          nombres: 'María', 
          apellidos: 'Gómez', 
          nombre: 'María Gómez',
          codigo_docente: 'DOC002' 
        }
      ];
      this.loadGrupos();
    }
  });
}

  private loadGrupos(): void {
    this.grupoService.findAll().subscribe({
      next: (grupos) => {
        console.log('Grupos cargados:', grupos);
        this.grupos = grupos;
        this.loadAsignaturas();
      },
      error: (error) => {
        console.error('Error cargando grupos:', error);
        this.grupos = [];
        this.loadAsignaturas();
      }
    });
  }

  private loadAsignaturas(): void {
    this.asignaturaService.findAll().subscribe({
      next: (asignaturas) => {
        console.log('Asignaturas cargadas:', asignaturas);
        this.asignaturas = asignaturas;
        this.loadingData = false;
      },
      error: (error) => {
        console.error('Error cargando asignaturas:', error);
        this.asignaturas = [];
        this.loadingData = false;
      }
    });
  }

  onSubmitForm(dto: CreateGrupoAsignaturaDocente): void {
    this.loading = true;

    if (this.mode === 'create') {
      this.grupoAsignaturaDocenteService.create(dto).subscribe({
        next: () => {
          this.router.navigate(['/grupo-asignatura-docente']);
        },
        error: (error) => {
          console.error('Error creating asignacion:', error);
          alert('Error al crear la asignación: ' + (error.error?.message || error.message));
          this.loading = false;
        }
      });
    } else if (this.mode === 'edit' && this.asignacion) {
      this.grupoAsignaturaDocenteService.update(this.asignacion.id_grupo_asignatura_docente, dto).subscribe({
        next: () => {
          this.router.navigate(['/grupo-asignatura-docente']);
        },
        error: (error) => {
          console.error('Error updating asignacion:', error);
          alert('Error al actualizar la asignación: ' + (error.error?.message || error.message));
          this.loading = false;
        }
      });
    }
  }

onSubmitBulkForm(dto: CreateBulkGrupoAsignaturaDocente): void {
  this.loading = true;

  this.grupoAsignaturaDocenteService.createBulk(dto).subscribe({
    next: (response: BulkCreateResponse) => {
      if (response.fallidas === 0) {
        alert(`¡Éxito! Se crearon ${response.exitosas} asignaciones correctamente.`);
        this.router.navigate(['/grupo-asignatura-docente']);
      } else {
        const mensaje = `Se crearon ${response.exitosas} asignaciones exitosamente, pero ${response.fallidas} fallaron:\n\n` +
          response.errores.map((error: any) => 
            `• Asignatura ${error.asignatura}, Docente ${error.docente}: ${error.error}`
          ).join('\n');
        
        alert(mensaje);
        this.router.navigate(['/grupo-asignatura-docente']);
      }
    },
    error: (error) => {
      console.error('Error creating bulk asignaciones:', error);
      alert('Error al crear las asignaciones: ' + (error.error?.message || error.message));
      this.loading = false;
    }
  });
}

  onCancel(): void {
    this.router.navigate(['/grupo-asignatura-docente']);
  }
}