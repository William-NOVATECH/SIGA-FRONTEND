import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoService } from '../../services/grupo.service';
import { AsignaturaService } from '../../services/asignatura.service';
import { DocenteService } from '../../services/docente.service';
import { CreateGrupoAsignaturaDocente } from '../../models/create-grupo-asignatura-docente.model';
import { CreateBulkGrupoAsignaturaDocente } from '../../models/create-bulk-grupo-asignatura-docente.model';
import { BulkCreateResponse, GrupoAsignaturaDocente, CreateVersionInicialDto } from '../../models/grupo-asignatura-docente.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-manage-grupo-asignatura-docente',
  standalone: false,
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
    private docenteService: DocenteService,
    private authService: AuthService,
    private toastService: ToastService
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
      // Si es coordinador, usar createVersionInicial
      if (this.authService.isCoordinador()) {
        const versionInicialDto: CreateVersionInicialDto = {
          id_grupo: dto.id_grupo,
          id_asignatura: dto.id_asignatura,
          id_docente: dto.id_docente,
          estado: dto.estado || 'activa',
          observaciones: dto.observaciones
        };
        
        this.grupoAsignaturaDocenteService.createVersionInicial(versionInicialDto).subscribe({
          next: (asignacion) => {
            console.log('✅ Versión inicial creada (respuesta inmediata):', asignacion);
            console.log('ID coordinador en respuesta inmediata:', asignacion.id_coordinador_carrera);
            
            // Recargar la asignación completa desde el backend para obtener todos los campos
            // (el backend puede no retornar id_coordinador_carrera en la respuesta de creación)
            this.grupoAsignaturaDocenteService.findOne(asignacion.id_grupo_asignatura_docente).subscribe({
              next: (asignacionCompleta) => {
                console.log('✅ Asignación recargada completa:', asignacionCompleta);
                console.log('ID coordinador después de recargar:', asignacionCompleta.id_coordinador_carrera);
                
                // Actualizar usuario actual desde el backend para asegurar que tenemos el ID correcto
                this.authService.fetchCurrentUserWithRoles().subscribe(user => {
                  if (user) {
                    console.log('Usuario actualizado después de crear asignación:', user.id_usuario, user.username);
                  }
                });
                
                this.toastService.showSuccess('Versión inicial creada', 'La carga docente se ha creado correctamente en estado borrador.');
                this.router.navigate(['/grupo-asignatura-docente', 'detail', asignacionCompleta.id_grupo_asignatura_docente]);
              },
              error: (error) => {
                console.error('Error al recargar asignación:', error);
                // Aún así, navegar a la página de detalle
                this.toastService.showSuccess('Versión inicial creada', 'La carga docente se ha creado correctamente en estado borrador.');
                this.router.navigate(['/grupo-asignatura-docente', 'detail', asignacion.id_grupo_asignatura_docente]);
              }
            });
          },
          error: (error) => {
            console.error('Error creating version inicial:', error);
            const errorMessage = error.error?.message || error.message || 'No se pudo crear la versión inicial.';
            this.toastService.showError('Error al crear', errorMessage);
            this.loading = false;
          }
        });
      } else {
        // Si no es coordinador, usar el método normal
        this.grupoAsignaturaDocenteService.create(dto).subscribe({
          next: () => {
            this.toastService.showSuccess('Asignación creada', 'La asignación se ha creado correctamente.');
            this.router.navigate(['/grupo-asignatura-docente']);
          },
          error: (error) => {
            console.error('Error creating asignacion:', error);
            const errorMessage = error.error?.message || error.message || 'No se pudo crear la asignación.';
            this.toastService.showError('Error al crear', errorMessage);
            this.loading = false;
          }
        });
      }
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

  // Asegurar que id_plan sea un número válido
  if (!dto.id_plan || dto.id_plan < 1) {
    this.toastService.showError('Error de validación', 'El plan es requerido y debe ser válido.');
    this.loading = false;
    return;
  }

  // Validar que todas las asignaturas tengan docente asignado
  if (!dto.asignaturas_docentes || dto.asignaturas_docentes.length === 0) {
    this.toastService.showError('Error de validación', 'Debes agregar al menos una asignatura con docente.');
    this.loading = false;
    return;
  }

  // Convertir id_plan a número si viene como string
  const bulkDto: CreateBulkGrupoAsignaturaDocente = {
    ...dto,
    id_plan: Number(dto.id_plan),
    id_grupo: Number(dto.id_grupo),
    asignaturas_docentes: dto.asignaturas_docentes.map(item => ({
      id_asignatura: Number(item.id_asignatura),
      id_docente: Number(item.id_docente)
    }))
  };

  this.grupoAsignaturaDocenteService.createBulk(bulkDto).subscribe({
    next: (response: BulkCreateResponse) => {
      this.loading = false;
      
      // La respuesta ahora incluye información del grupo, plan y carrera
      const grupoInfo = response.grupo ? 
        `${response.grupo.codigo_grupo} - ${response.grupo.nombre_grupo || 'Sin nombre'}` : 
        'grupo seleccionado';

      if (response.fallidas === 0) {
        // Todo exitoso
        const mensaje = `Se crearon ${response.exitosas} asignación(es) correctamente para el ${grupoInfo}.`;
        this.toastService.showSuccess('Asignaciones creadas', mensaje);
        this.router.navigate(['/grupo-asignatura-docente']);
      } else if (response.exitosas > 0) {
        // Parcialmente exitoso
        let mensaje = `Se crearon ${response.exitosas} asignación(es) exitosamente para el ${grupoInfo}.`;
        mensaje += `\n${response.fallidas} asignación(es) fallaron.`;
        
        // Mostrar detalles de errores
        if (response.errores && response.errores.length > 0) {
          const erroresDetalle = response.errores.slice(0, 3).map(e => 
            `• Asignatura ${e.asignatura}, Docente ${e.docente}: ${e.error}`
          ).join('\n');
          
          if (response.errores.length > 3) {
            mensaje += `\n\nErrores (mostrando primeros 3):\n${erroresDetalle}\n... y ${response.errores.length - 3} más.`;
          } else {
            mensaje += `\n\nErrores:\n${erroresDetalle}`;
          }
        }
        
        this.toastService.showWarn('Creación parcial', mensaje);
        console.warn('Errores completos:', response.errores);
        this.router.navigate(['/grupo-asignatura-docente']);
      } else {
        // Todo falló
        let mensaje = `No se pudo crear ninguna asignación para el ${grupoInfo}.`;
        if (response.errores && response.errores.length > 0) {
          const erroresDetalle = response.errores.map(e => 
            `• Asignatura ${e.asignatura}, Docente ${e.docente}: ${e.error}`
          ).join('\n');
          mensaje += `\n\nErrores:\n${erroresDetalle}`;
        }
        this.toastService.showError('Error al crear', mensaje);
      }
    },
    error: (error) => {
      console.error('Error creating bulk asignaciones:', error);
      
      let errorMessage = 'No se pudieron crear las asignaciones.';
      
      // Mensajes de error más descriptivos
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Error de validación: Verifica que todas las asignaturas pertenezcan al plan del grupo.';
      } else if (error.status === 404) {
        errorMessage = 'No se encontró el grupo o plan especificado.';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Algunas asignaciones ya existen (duplicados).';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      this.toastService.showError('Error al crear', errorMessage);
      this.loading = false;
    }
  });
}

  onCancel(): void {
    this.router.navigate(['/grupo-asignatura-docente']);
  }
}