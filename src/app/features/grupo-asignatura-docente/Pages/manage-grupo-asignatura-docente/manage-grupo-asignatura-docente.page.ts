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
import { CarreraService } from '../../../carreras/services/carrera.service';
import { PlanService } from '../../../planes/services/plan.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
    private toastService: ToastService,
    private carreraService: CarreraService,
    private planService: PlanService
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
    // Verificar si el usuario es coordinador de carrera (id_rol: 2)
    this.authService.getActiveRoleId().subscribe({
      next: (roleId) => {
        if (roleId === 2) {
          // Es coordinador, obtener su carrera y filtrar grupos
          this.loadGruposForCoordinador();
        } else {
          // No es coordinador, cargar todos los grupos
          this.loadAllGrupos();
        }
      },
      error: (error) => {
        console.error('Error obteniendo rol del usuario:', error);
        // Fallback: cargar todos los grupos
        this.loadAllGrupos();
      }
    });
  }

  private loadGruposForCoordinador(): void {
    // Obtener usuario actual y carreras en paralelo
    const userId = this.authService.getUserIdFromToken();
    
    if (!userId) {
      console.warn('No se pudo obtener el ID del usuario, cargando todos los grupos');
      this.loadAllGrupos();
      return;
    }

    forkJoin({
      user: this.authService.fetchCurrentUserWithRoles(),
      carreras: this.carreraService.findAll(),
      planes: this.planService.findAll(),
      grupos: this.grupoService.findAll()
    }).pipe(
      map(({ user, carreras, planes, grupos }) => {
        // Buscar la carrera donde el usuario es coordinador
        const carrerasArray = Array.isArray(carreras.data) ? carreras.data : [carreras.data];
        const carreraDelCoordinador = carrerasArray.find((carrera: any) => 
          carrera.coordinador && carrera.coordinador.id_usuario === userId
        );

        if (!carreraDelCoordinador) {
          console.warn('No se encontró carrera asociada al coordinador, no se mostrarán grupos');
          return [];
        }

        console.log('Carrera del coordinador encontrada:', carreraDelCoordinador);
        
        // Obtener los planes que contienen la carrera del coordinador
        const planesConCarrera = planes.filter((plan: any) => {
          if (!plan.carreras || !Array.isArray(plan.carreras)) {
            return false;
          }
          return plan.carreras.some((planCarrera: any) => 
            planCarrera.carrera?.id_carrera === carreraDelCoordinador.id_carrera
          );
        });

        const planesIds = planesConCarrera.map((plan: any) => plan.id_plan);
        console.log(`Planes que contienen la carrera del coordinador (${planesIds.length}):`, planesIds);
        console.log(`Total de grupos recibidos: ${grupos.length}`);

        // Filtrar grupos que pertenezcan a la carrera del coordinador
        // Mostrar todos los grupos de la carrera, incluso si no tienen plan asociado
        const gruposFiltrados = grupos.filter((grupo: any) => {
          const grupoCarreraMatch = grupo.id_carrera === carreraDelCoordinador.id_carrera || 
                                   grupo.carrera?.id_carrera === carreraDelCoordinador.id_carrera;
          
          if (!grupoCarreraMatch) {
            return false;
          }

          // Si el grupo tiene un plan, verificar que el plan contenga la carrera
          if (grupo.id_plan) {
            const grupoPlanMatch = planesIds.includes(grupo.id_plan);
            if (!grupoPlanMatch) {
              console.warn(`Grupo ${grupo.id_grupo} (${grupo.codigo_grupo}) tiene plan ${grupo.id_plan} que no contiene la carrera del coordinador`);
              // Aún así, mostrarlo si pertenece a la carrera (puede ser un grupo nuevo sin plan válido)
              return true;
            }
          } else {
            console.warn(`Grupo ${grupo.id_grupo} (${grupo.codigo_grupo}) no tiene plan asociado, pero pertenece a la carrera del coordinador`);
          }
          
          return true;
        });

        console.log(`Grupos filtrados para coordinador (${gruposFiltrados.length} de ${grupos.length}):`, gruposFiltrados.map((g: any) => ({
          id: g.id_grupo,
          codigo: g.codigo_grupo,
          carrera: g.id_carrera,
          plan: g.id_plan
        })));
        return gruposFiltrados;
      }),
      catchError((error) => {
        console.error('Error cargando grupos para coordinador:', error);
        return of([]);
      })
    ).subscribe({
      next: (grupos) => {
        this.grupos = grupos;
        this.loadAsignaturas();
      },
      error: (error) => {
        console.error('Error en el flujo de carga de grupos:', error);
        this.grupos = [];
        this.loadAsignaturas();
      }
    });
  }

  private loadAllGrupos(): void {
    this.grupoService.findAll().subscribe({
      next: (grupos) => {
        console.log('Grupos cargados (todos):', grupos);
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
      // Si es coordinador (id_rol: 2), usar createVersionInicial
      // Verificar por id_rol en lugar de nombre_rol
      console.log('🔍 Verificando rol del usuario antes de crear versión inicial...');
      
      // Obtener información completa del usuario antes de hacer la petición
      this.authService.fetchCurrentUserWithRoles().subscribe({
        next: (user) => {
          console.log('👤 Usuario completo obtenido:', user);
          console.log('📋 Roles del usuario:', user?.roles || user?.rol);
          
          // Obtener el id_rol activo
          this.authService.getActiveRoleId().subscribe({
            next: (roleId) => {
              console.log('🆔 ID de rol activo obtenido:', roleId);
              
              // Verificar también el nombre del rol para debugging
              let roleName = 'desconocido';
              if (user?.roles && user.roles.length > 0) {
                const activeRole = user.roles.find((r: any) => r.estado === 'activo');
                if (activeRole?.rol) {
                  roleName = activeRole.rol.nombre_rol;
                  console.log('📛 Nombre del rol activo:', roleName);
                }
              }
              
              const isCoordinador = roleId === 2;
              console.log('✅ ¿Es coordinador (id_rol === 2)?', isCoordinador);
              
              if (!isCoordinador) {
                console.warn('⚠️ Usuario no es coordinador. id_rol:', roleId, 'nombre_rol:', roleName);
                this.loading = false;
                this.toastService.showError(
                  'Sin permisos', 
                  'Solo los Coordinadores de carrera (id_rol: 2) pueden crear versiones iniciales. Tu rol actual: ' + roleName + ' (id_rol: ' + roleId + ')'
                );
                return;
              }
              
              // Verificar que el token esté presente
              const token = this.authService.getToken();
              if (!token) {
                console.error('❌ No hay token disponible');
                this.loading = false;
                this.toastService.showError('Error de autenticación', 'No hay token de autenticación. Por favor, inicia sesión nuevamente.');
                return;
              }
              
              // Decodificar el token para verificar su contenido
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('🎫 Contenido del token JWT:', {
                  sub: payload.sub,
                  username: payload.username,
                  roles: payload.roles,
                  exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expira'
                });
              } catch (error) {
                console.error('❌ Error decodificando token:', error);
              }
              
              // Crear versión inicial (solo coordinadores)
              const versionInicialDto: CreateVersionInicialDto = {
                id_grupo: dto.id_grupo,
                id_asignatura: dto.id_asignatura,
                id_docente: dto.id_docente,
                estado: dto.estado || 'activa',
                observaciones: dto.observaciones
              };
              
              console.log('📤 Enviando petición POST a /version-inicial con datos:', versionInicialDto);
              console.log('🔑 Token presente:', !!token, 'Longitud:', token?.length);
              
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
                    
                    this.loading = false;
                    this.toastService.showSuccess('Versión inicial creada', 'La carga docente se ha creado correctamente en estado borrador.');
                    this.router.navigate(['/grupo-asignatura-docente', 'detail', asignacionCompleta.id_grupo_asignatura_docente]);
                  },
                  error: (error) => {
                    console.error('Error al recargar asignación:', error);
                    // Aún así, navegar a la página de detalle
                    this.loading = false;
                    this.toastService.showSuccess('Versión inicial creada', 'La carga docente se ha creado correctamente en estado borrador.');
                    this.router.navigate(['/grupo-asignatura-docente', 'detail', asignacion.id_grupo_asignatura_docente]);
                  }
                });
                },
                error: (err) => {
                  console.error('❌ Error creating version inicial:', err);
                  console.error('📊 Detalles del error:', {
                    status: err.status,
                    statusText: err.statusText,
                    url: err.url,
                    message: err.message,
                    error: err.error
                  });
                  
                  this.loading = false;
                  
                  // Mensaje de error más descriptivo
                  let errorMessage = 'No se pudo crear la versión inicial.';
                  
                  if (err.status === 403) {
                    errorMessage = 'No tienes permisos para crear una versión inicial. Verifica que:';
                    errorMessage += '\n1. Tu rol sea "Coordinador de carrera" (id_rol: 2)';
                    errorMessage += '\n2. Tu token de autenticación sea válido';
                    errorMessage += '\n3. El backend tenga configurado correctamente los permisos para este endpoint';
                    
                    // Mostrar información adicional en consola
                    console.error('🔒 Error 403 - Posibles causas:');
                    console.error('1. El backend está validando el rol de manera diferente');
                    console.error('2. El token no contiene la información correcta del rol');
                    console.error('3. El backend espera un formato específico de autenticación');
                    console.error('4. El usuario no tiene el rol correcto en la base de datos del backend');
                  } else if (err.status === 401) {
                    errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
                  } else {
                    errorMessage = err.error?.message || err.message || errorMessage;
                  }
                  
                  this.toastService.showError('Error al crear versión inicial', errorMessage);
                }
              });
            },
            error: (roleErr) => {
              console.error('❌ Error obteniendo id_rol:', roleErr);
              this.loading = false;
              this.toastService.showError('Error', 'No se pudo verificar tu rol. Por favor, intenta nuevamente.');
            }
          });
        },
        error: (userErr) => {
          console.error('❌ Error obteniendo usuario completo:', userErr);
          this.loading = false;
          // Fallback: usar método create normal si no se puede obtener el usuario
          this.grupoAsignaturaDocenteService.create(dto).subscribe({
            next: (asignacion) => {
              this.loading = false;
              this.toastService.showSuccess('Asignación creada', 'La asignación se ha creado correctamente.');
              this.router.navigate(['/grupo-asignatura-docente', 'detail', asignacion.id_grupo_asignatura_docente]);
            },
            error: (err) => {
              this.loading = false;
              const errorMessage = err.error?.message || err.message || 'No se pudo crear la asignación.';
              this.toastService.showError('Error', errorMessage);
              console.error('Error creating asignacion:', err);
            }
          });
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