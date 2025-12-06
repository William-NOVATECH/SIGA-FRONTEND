import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoAsignaturaDocente, CargaDocenteVersion, RevisarCargaDto } from '../../models/grupo-asignatura-docente.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { UsuarioService } from '../../../admin/services/usuario.service';
import { Usuario } from '../../../admin/interfaces/usuario.interface';
import { DocenteService } from '../../services/docente.service';

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
  recargaPendiente = false; // Flag para evitar recargas múltiples
  
  // Versionamiento
  versiones: CargaDocenteVersion[] = [];
  loadingVersiones = false;
  showHistorialModal = false;
  showCompararModal = false;
  version1Selected?: number;
  version2Selected?: number;
  comparacionResult: any = null;

  // Modal de revisión
  showRevisarModal = false;
  revisarForm: any = {
    aprobado: true,
    observaciones: '',
    cambios: {
      id_docente: null,
      estado: null,
      observaciones: ''
    }
  };
  docentesDisponibles: any[] = [];

  // Modal de aprobación final
  showAprobarFinalModal = false;
  aprobarFinalForm: any = {
    observaciones: ''
  };

  // Cache de roles
  private isCoordinadorCached: boolean = false;
  private isDirectorCached: boolean = false;
  private isAdministradorCached: boolean = false;

  // Información del usuario creador
  usuarioCreador: Usuario | null = null;
  loadingCreador: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private usuarioService: UsuarioService,
    private docenteService: DocenteService
  ) {}

  ngOnInit(): void {
    this.loadAsignacion();
    this.loadUserRoles();
  }

  // Cargar roles del usuario desde el backend
  loadUserRoles(): void {
    // Obtener el rol actual del usuario desde el backend
    this.authService.getCurrentUserRole().subscribe({
      next: (roleName) => {
        if (roleName) {
          const normalizedRole = roleName.toLowerCase();
          console.log('Rol obtenido del backend:', roleName, '→ normalizado:', normalizedRole);
          
          // Actualizar cache de roles basado en el rol obtenido
          this.isCoordinadorCached = normalizedRole === 'coordinador' || normalizedRole.includes('coordinador');
          this.isDirectorCached = normalizedRole === 'director' || normalizedRole === 'directores' || normalizedRole.includes('director');
          this.isAdministradorCached = normalizedRole === 'administrador' || normalizedRole === 'admin' || normalizedRole.includes('administrador');
          
          console.log('Roles actualizados:', {
            coordinador: this.isCoordinadorCached,
            director: this.isDirectorCached,
            administrador: this.isAdministradorCached
          });
        } else {
          console.warn('No se pudo obtener el rol del backend, usando verificación async como fallback');
          // Fallback: usar métodos async
          this.authService.isCoordinadorAsync().subscribe(isCoord => this.isCoordinadorCached = isCoord);
          this.authService.isDirectorAsync().subscribe(isDir => this.isDirectorCached = isDir);
          this.authService.isAdministradorAsync().subscribe(isAdmin => this.isAdministradorCached = isAdmin);
        }
      },
      error: (error) => {
        console.error('Error obteniendo rol del backend:', error);
        // Fallback: usar métodos async
        this.authService.isCoordinadorAsync().subscribe(isCoord => this.isCoordinadorCached = isCoord);
        this.authService.isDirectorAsync().subscribe(isDir => this.isDirectorCached = isDir);
        this.authService.isAdministradorAsync().subscribe(isAdmin => this.isAdministradorCached = isAdmin);
      }
    });
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
        console.log('id_coordinador_carrera:', asignacion.id_coordinador_carrera);
        console.log('estado_aprobacion:', asignacion.estado_aprobacion);
        
        const currentUser = this.authService.getCurrentUser();
        const userIdFromToken = this.authService.getUserIdFromToken();
        console.log('Usuario actual (getCurrentUser):', currentUser?.id_usuario, currentUser?.username);
        console.log('Usuario actual (getUserIdFromToken):', userIdFromToken);
        console.log('Comparación - Usuario actual:', currentUser?.id_usuario || userIdFromToken, 'vs id_coordinador_carrera:', asignacion.id_coordinador_carrera);
        
        // Si no hay id_coordinador_carrera pero el estado es borrador y el usuario es coordinador,
        // intentar recargar UNA SOLA VEZ (el backend puede tardar en actualizar)
        if (!asignacion.id_coordinador_carrera && 
            asignacion.estado_aprobacion === 'borrador' && 
            this.authService.isCoordinador() &&
            !this.recargaPendiente) {
          this.recargaPendiente = true; 
          console.warn('⚠️ Asignación sin id_coordinador_carrera. Recargando una vez después de 2 segundos...');
          setTimeout(() => {
            this.grupoAsignaturaDocenteService.findOne(id).subscribe({
              next: (asignacionRecargada) => {
                console.log('Asignación recargada:', asignacionRecargada);
                console.log('id_coordinador_carrera después de recargar:', asignacionRecargada.id_coordinador_carrera);
                if (asignacionRecargada.id_coordinador_carrera) {
                  this.asignacion = asignacionRecargada;
                  if (asignacionRecargada.id_coordinador_carrera) {
                    this.loadUsuarioCreador(asignacionRecargada.id_coordinador_carrera);
                  }
                }
              },
              error: (error) => {
                console.error('Error al recargar asignación:', error);
              }
            });
          }, 2000);
        }
        
        this.asignacion = asignacion;
        this.loading = false;
        
        // Cargar información del usuario creador si existe
        if (asignacion.id_coordinador_carrera) {
          this.loadUsuarioCreador(asignacion.id_coordinador_carrera);
        }
        
        // Cargar usuario actual con roles para asegurar que tenemos el ID correcto
        this.authService.fetchCurrentUserWithRoles().subscribe(user => {
          if (user) {
            console.log('Usuario actualizado desde backend:', user.id_usuario, user.username);
          }
        });
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
    if (!this.asignacion) return;

    this.confirmService.confirmDelete(
      () => {
        this.loading = true;
        this.grupoAsignaturaDocenteService.remove(this.asignacion!.id_grupo_asignatura_docente).subscribe({
          next: () => {
            this.toastService.showSuccess('Asignación eliminada', 'La asignación se ha eliminado correctamente.');
            this.router.navigate(['/grupo-asignatura-docente']);
          },
          error: (error) => {
            this.loading = false;
            const errorMessage = error.error?.message || error.message || 'No se pudo eliminar la asignación.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      '¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer.',
      'Confirmar eliminación'
    );
  }

  onBack(): void {
    this.router.navigate(['/grupo-asignatura-docente']);
  }

  // Cargar información del usuario creador
  loadUsuarioCreador(idUsuario: number): void {
    if (!idUsuario) return;
    
    this.loadingCreador = true;
    this.usuarioService.getUsuarioById(idUsuario).subscribe({
      next: (usuario) => {
        this.usuarioCreador = usuario;
        this.loadingCreador = false;
        console.log('Usuario creador cargado:', usuario);
      },
      error: (error) => {
        console.error('Error cargando usuario creador:', error);
        this.loadingCreador = false;
        // No mostrar error al usuario, solo log
      }
    });
  }

  // Obtener nombre del usuario creador
  getNombreUsuarioCreador(): string {
    if (!this.usuarioCreador) {
      if (this.asignacion?.id_coordinador_carrera) {
        return `Usuario ID: ${this.asignacion.id_coordinador_carrera}`;
      }
      return 'No especificado';
    }
    return this.usuarioCreador.username || this.usuarioCreador.email || 'Usuario desconocido';
  }

  // Verificar si el usuario actual es el creador
  esUsuarioCreador(): boolean {
    if (!this.asignacion?.id_coordinador_carrera) return false;
    
    // Obtener el ID del usuario actual desde múltiples fuentes
    const currentUser = this.authService.getCurrentUser();
    const userIdFromToken = this.authService.getUserIdFromToken();
    const userId = currentUser?.id_usuario || userIdFromToken;
    
    if (!userId) return false;
    
    const userIdNum = Number(userId);
    const coordinadorNum = Number(this.asignacion.id_coordinador_carrera);
    
    return !isNaN(userIdNum) && !isNaN(coordinadorNum) && userIdNum === coordinadorNum;
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

  // ========== MÉTODOS DE VERSIONAMIENTO Y APROBACIÓN ==========

  // Verificar roles (usa cache del backend como prioridad)
  isCoordinador(): boolean {
    // Prioridad 1: Usar cache del backend (más confiable)
    if (this.isCoordinadorCached) {
      return true;
    }
    // Prioridad 2: Verificar desde el token (fallback rápido)
    return this.authService.isCoordinador();
  }

  isDirector(): boolean {
    // Prioridad 1: Usar cache del backend (más confiable)
    if (this.isDirectorCached) {
      return true;
    }
    // Prioridad 2: Verificar desde el token (fallback rápido)
    return this.authService.isDirector();
  }

  isAdministrador(): boolean {
    // Prioridad 1: Usar cache del backend (más confiable)
    if (this.isAdministradorCached) {
      return true;
    }
    // Prioridad 2: Verificar desde el token (fallback rápido)
    return this.authService.isAdministrador();
  }

  // Verificar si puede enviar a revisión (solo coordinador que creó)
  canEnviarRevision(): boolean {
    if (!this.asignacion) {
      console.log('canEnviarRevision: No hay asignación');
      return false;
    }

    // Verificar que el estado sea borrador
    if (this.asignacion.estado_aprobacion !== 'borrador') {
      console.log('canEnviarRevision: Estado no es borrador, es:', this.asignacion.estado_aprobacion);
      return false;
    }

    // Verificar que el usuario sea coordinador (usando cache o verificación directa)
    const isCoord = this.isCoordinador();
    if (!isCoord) {
      console.log('canEnviarRevision: Usuario no es coordinador. Cache:', this.isCoordinadorCached, 'Token:', this.authService.isCoordinador());
      return false;
    }

    // Obtener el ID del usuario actual desde múltiples fuentes
    const currentUser = this.authService.getCurrentUser();
    const userIdFromToken = this.authService.getUserIdFromToken();
    
    // Prioridad 1: id_usuario del objeto usuario (más confiable)
    // Prioridad 2: userId del token
    const userId = currentUser?.id_usuario || userIdFromToken;
    const idCoordinador = this.asignacion.id_coordinador_carrera;

    console.log('canEnviarRevision - Debug Completo:', {
      currentUser: currentUser ? {
        id_usuario: currentUser.id_usuario,
        username: currentUser.username,
        email: currentUser.email
      } : null,
      userIdFromToken: userIdFromToken,
      userIdFinal: userId,
      id_coordinador_carrera: idCoordinador,
      estado_aprobacion: this.asignacion.estado_aprobacion,
      isCoordinador: isCoord,
      isCoordinadorCached: this.isCoordinadorCached
    });

    // Si no hay id_coordinador_carrera, permitir si el usuario es coordinador y está en borrador
    // El backend debería poder verificar desde el token si no hay id_coordinador_carrera
    // NO recargar aquí porque canEnviarRevision se llama muchas veces (en cada detección de cambios)
    if (!idCoordinador) {
      console.warn('canEnviarRevision: No hay id_coordinador_carrera, pero el usuario es coordinador y está en borrador. El backend debe verificar desde el token.');
      // Permitir - el backend debe verificar desde el token si no hay id_coordinador_carrera
      return true;
    }

    // Si no tenemos userId, no podemos verificar
    if (!userId) {
      console.error('canEnviarRevision: No se pudo obtener el ID del usuario. currentUser:', currentUser, 'userIdFromToken:', userIdFromToken);
      // Como fallback, si es coordinador y está en borrador, permitir
      console.warn('canEnviarRevision: Como fallback, permitiendo envío porque usuario es coordinador y asignación está en borrador');
      return true;
    }

    // Comparación flexible: convertir ambos a número para evitar problemas de tipo
    const userIdNum = Number(userId);
    const coordinadorNum = Number(idCoordinador);

    // Verificar que las conversiones fueron exitosas
    if (isNaN(userIdNum)) {
      console.error('canEnviarRevision: userId no es un número válido:', userId);
      return false;
    }

    if (isNaN(coordinadorNum)) {
      console.error('canEnviarRevision: id_coordinador_carrera no es un número válido:', idCoordinador);
      return false;
    }

    const canSend = userIdNum === coordinadorNum;
    
    if (!canSend) {
      console.warn('canEnviarRevision: ❌ No coincide el coordinador. userId:', userIdNum, '(tipo:', typeof userIdNum, ') id_coordinador_carrera:', coordinadorNum, '(tipo:', typeof coordinadorNum, ')');
      console.warn('canEnviarRevision: Asignación completa:', {
        id_grupo_asignatura_docente: this.asignacion.id_grupo_asignatura_docente,
        id_coordinador_carrera: this.asignacion.id_coordinador_carrera,
        estado_aprobacion: this.asignacion.estado_aprobacion
      });
      // NO permitir si no coincide - esto es un problema que debe resolverse
      return false;
    }

    console.log('canEnviarRevision: ✅ Permitiendo envío - Usuario es coordinador y coincide con el creador');
    return true;
  }

  // Verificar si puede revisar (director)
  canRevisar(): boolean {
    if (!this.asignacion || !this.isDirector()) return false;
    return this.asignacion.estado_aprobacion === 'pendiente_revision';
  }

  // Verificar si puede aprobar final (administrador)
  canAprobarFinal(): boolean {
    if (!this.asignacion || !this.isAdministrador()) return false;
    return this.asignacion.estado_aprobacion === 'revisada' || 
           this.asignacion.estado_aprobacion === 'pendiente_aprobacion';
  }

  // Enviar a revisión
  onEnviarRevision(): void {
    if (!this.asignacion) return;

    // Verificar token antes de enviar
    const token = this.authService.getToken();
    if (!token) {
      this.toastService.showError('Error de autenticación', 'No hay token de autenticación. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Obtener información completa del usuario antes de enviar
    const currentUser = this.authService.getCurrentUser();
    const userIdFromToken = this.authService.getUserIdFromToken();
    const userId = currentUser?.id_usuario || userIdFromToken;

    if (!userId) {
      this.toastService.showError('Error', 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Validar rol del usuario usando el endpoint /usuario/{id}/with-roles ANTES de enviar
    this.loading = true;
    this.authService.fetchCurrentUserWithRoles().subscribe({
      next: (userWithRoles) => {
        // MOSTRAR RESPUESTA COMPLETA EN CONSOLA
        console.log('========================================');
        console.log('✅ RESPUESTA COMPLETA DEL ENDPOINT /usuario/{id}/with-roles:');
        console.log(JSON.stringify(userWithRoles, null, 2));
        console.log('========================================');
        
        this.loading = false;
        
        if (!userWithRoles) {
          console.error('❌ userWithRoles es null o undefined');
          this.toastService.showError('Error', 'No se pudo verificar el usuario.');
          return;
        }

        // Log detallado de la estructura de roles
        console.log('🔍 Análisis detallado de roles:');
        console.log('- userWithRoles.roles (array):', userWithRoles.roles);
        console.log('- userWithRoles.rol (objeto):', userWithRoles.rol);
        console.log('- Tipo de userWithRoles.roles:', typeof userWithRoles.roles, Array.isArray(userWithRoles.roles));
        
        if (userWithRoles.roles && Array.isArray(userWithRoles.roles)) {
          userWithRoles.roles.forEach((r: any, index: number) => {
            console.log(`  Rol ${index}:`, {
              estado: r.estado,
              tieneRol: !!r.rol,
              nombre_rol: r.rol?.nombre_rol,
              nombre_rol_lowercase: r.rol?.nombre_rol?.toLowerCase(),
              esActivo: r.estado === 'activo',
              esCoordinador: r.rol?.nombre_rol?.toLowerCase() === 'coordinador',
              cumpleCondicion: r.estado === 'activo' && r.rol?.nombre_rol?.toLowerCase() === 'coordinador'
            });
          });
        }

        // Verificar si el usuario tiene rol de coordinador activo
        // Primero verificar en el array roles
        let tieneRolCoordinadorEnArray = false;
        if (userWithRoles.roles && Array.isArray(userWithRoles.roles)) {
          tieneRolCoordinadorEnArray = userWithRoles.roles.some((r: any) => {
            const estadoActivo = r.estado === 'activo';
            const nombreRol = r.rol?.nombre_rol?.toLowerCase();
            const esCoordinador = nombreRol === 'coordinador';
            const resultado = estadoActivo && esCoordinador;
            console.log(`  Verificando rol en array: estado=${estadoActivo}, nombre=${nombreRol}, esCoordinador=${esCoordinador}, resultado=${resultado}`);
            return resultado;
          });
        }

        // También verificar en el objeto rol (por si viene en formato diferente)
        let tieneRolCoordinadorEnObjeto = false;
        if (userWithRoles.rol) {
          const estadoActivo = userWithRoles.rol.estado === 'activo';
          const nombreRol = userWithRoles.rol.rol?.nombre_rol?.toLowerCase();
          const esCoordinador = nombreRol === 'coordinador';
          tieneRolCoordinadorEnObjeto = estadoActivo && esCoordinador;
          console.log(`  Verificando rol en objeto: estado=${estadoActivo}, nombre=${nombreRol}, esCoordinador=${esCoordinador}, resultado=${tieneRolCoordinadorEnObjeto}`);
        }

        const tieneRolCoordinador = tieneRolCoordinadorEnArray || tieneRolCoordinadorEnObjeto;

        console.log('📊 RESUMEN DE VALIDACIÓN:');
        console.log({
          userId: userWithRoles.id_usuario,
          username: userWithRoles.username,
          tieneRolCoordinadorEnArray,
          tieneRolCoordinadorEnObjeto,
          tieneRolCoordinador,
          id_coordinador_carrera: this.asignacion?.id_coordinador_carrera,
          asignacionId: this.asignacion?.id_grupo_asignatura_docente,
          estructuraCompleta: userWithRoles
        });

        if (!tieneRolCoordinador) {
          this.toastService.showError('Sin permisos', 'No tienes el rol de Coordinador necesario para enviar a revisión.');
          return;
        }

        // Verificar si el usuario es el creador (si existe id_coordinador_carrera)
        if (this.asignacion && this.asignacion.id_coordinador_carrera) {
          if (Number(userWithRoles.id_usuario) !== Number(this.asignacion.id_coordinador_carrera)) {
            this.toastService.showError('Sin permisos', `Solo el coordinador que creó esta asignación puede enviarla a revisión. Usuario actual: ${userWithRoles.id_usuario}, Coordinador de la asignación: ${this.asignacion.id_coordinador_carrera}.`);
            return;
          }
        }

        // Si pasó todas las validaciones, mostrar confirmación y enviar
        this.confirmService.confirm({
          message: '¿Deseas enviar esta carga docente a revisión? El director de departamento podrá revisarla.',
          header: 'Enviar a Revisión',
          icon: 'pi pi-send',
          acceptCallback: () => {
            this.loading = true;
            console.log('Enviando a revisión. ID:', this.asignacion!.id_grupo_asignatura_docente);
            console.log('Usuario validado:', userWithRoles.id_usuario, userWithRoles.username);
            
            this.grupoAsignaturaDocenteService.enviarRevision(
              this.asignacion!.id_grupo_asignatura_docente,
              {}
            ).subscribe({
              next: (asignacion) => {
                this.asignacion = asignacion;
                this.loading = false;
                this.toastService.showSuccess('Enviado a revisión', 'La carga docente ha sido enviada a revisión.');
              },
              error: (err) => {
                this.loading = false;
                console.error('❌ Error completo al enviar a revisión:', err);
                console.error('Status:', err.status);
                console.error('Status Text:', err.statusText);
                console.error('Error body:', err.error);
                
                let errorMessage = 'No se pudo enviar a revisión.';
                
                if (err.status === 403) {
                  errorMessage = 'No tienes permisos para realizar esta acción. Verifica que tengas el rol de Coordinador y que seas el creador de esta asignación.';
                } else if (err.status === 401) {
                  errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
                  this.authService.logOut();
                } else if (err.error?.message) {
                  errorMessage = err.error.message;
                } else if (err.message) {
                  errorMessage = err.message;
                }
                
                this.toastService.showError('Error al enviar a revisión', errorMessage);
              }
            });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al validar usuario con roles:', err);
        this.toastService.showError('Error', 'No se pudo verificar los permisos del usuario. Por favor, intenta nuevamente.');
      }
    });
  }

  // Abrir modal de revisión
  onOpenRevisarModal(aprobado: boolean): void {
    if (!this.asignacion) return;

    // Resetear formulario
    this.revisarForm = {
      aprobado: aprobado,
      observaciones: '',
      cambios: {
        id_docente: this.asignacion.id_docente || null,
        estado: this.asignacion.estado || null,
        observaciones: ''
      }
    };

    // Cargar docentes disponibles si se aprueba (para permitir cambios)
    if (aprobado) {
      this.loadDocentes();
    }

    this.showRevisarModal = true;
  }

  // Cargar docentes disponibles
  loadDocentes(): void {
    this.docenteService.findAll().subscribe({
      next: (docentes) => {
        this.docentesDisponibles = docentes;
      },
      error: (error) => {
        console.error('Error cargando docentes:', error);
        this.docentesDisponibles = [];
      }
    });
  }

  // Cerrar modal de revisión
  onCloseRevisarModal(): void {
    this.showRevisarModal = false;
    this.revisarForm = {
      aprobado: true,
      observaciones: '',
      cambios: {
        id_docente: null,
        estado: null,
        observaciones: ''
      }
    };
  }

  // Confirmar y enviar revisión
  onConfirmRevisar(): void {
    if (!this.asignacion) return;

    // Construir DTO según la API
    const dto: RevisarCargaDto = {
      aprobado: this.revisarForm.aprobado,
      observaciones: this.revisarForm.observaciones || undefined
    };

    // Si está aprobado y hay cambios, agregarlos
    if (this.revisarForm.aprobado && this.hasChanges()) {
      dto.cambios = {};
      
      // Solo agregar cambios si son diferentes a los valores actuales
      if (this.revisarForm.cambios.id_docente && 
          this.revisarForm.cambios.id_docente !== this.asignacion.id_docente) {
        dto.cambios.id_docente = this.revisarForm.cambios.id_docente;
      }
      
      if (this.revisarForm.cambios.estado && 
          this.revisarForm.cambios.estado !== this.asignacion.estado) {
        dto.cambios.estado = this.revisarForm.cambios.estado;
      }
      
      if (this.revisarForm.cambios.observaciones && 
          this.revisarForm.cambios.observaciones.trim()) {
        dto.cambios.observaciones = this.revisarForm.cambios.observaciones;
      }

      // Si no hay cambios reales, eliminar el objeto cambios
      if (Object.keys(dto.cambios).length === 0) {
        delete dto.cambios;
      }
    }

    this.loading = true;
    this.grupoAsignaturaDocenteService.revisarCarga(
      this.asignacion.id_grupo_asignatura_docente,
      dto
    ).subscribe({
      next: (asignacion) => {
        this.asignacion = asignacion;
        this.loading = false;
        this.showRevisarModal = false;
        const message = dto.aprobado 
          ? 'La carga docente ha sido aprobada' + (dto.cambios ? ' con cambios' : '') + ' y se creó una nueva versión.'
          : 'La carga docente ha sido rechazada y volvió a borrador.';
        this.toastService.showSuccess(dto.aprobado ? 'Aprobada' : 'Rechazada', message);
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message || 'No se pudo procesar la revisión.';
        this.toastService.showError('Error', errorMessage);
      }
    });
  }

  // Verificar si hay cambios
  hasChanges(): boolean {
    if (!this.asignacion) return false;
    
    const cambios = this.revisarForm.cambios;
    return (
      (cambios.id_docente && cambios.id_docente !== this.asignacion.id_docente) ||
      (cambios.estado && cambios.estado !== this.asignacion.estado) ||
      (cambios.observaciones && cambios.observaciones.trim() !== (this.asignacion.observaciones || '').trim())
    );
  }

  // Abrir modal de aprobación final
  onOpenAprobarFinalModal(): void {
    if (!this.asignacion) return;

    this.aprobarFinalForm = {
      observaciones: ''
    };

    this.showAprobarFinalModal = true;
  }

  // Cerrar modal de aprobación final
  onCloseAprobarFinalModal(): void {
    this.showAprobarFinalModal = false;
    this.aprobarFinalForm = {
      observaciones: ''
    };
  }

  // Confirmar y enviar aprobación final
  onConfirmAprobarFinal(): void {
    if (!this.asignacion) return;

    this.loading = true;
    this.grupoAsignaturaDocenteService.aprobarFinal(
      this.asignacion.id_grupo_asignatura_docente,
      {
        observaciones: this.aprobarFinalForm.observaciones || undefined
      }
    ).subscribe({
      next: (asignacion) => {
        this.asignacion = asignacion;
        this.loading = false;
        this.showAprobarFinalModal = false;
        this.toastService.showSuccess('Aprobación final', 'La carga docente ha sido aprobada definitivamente.');
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message || 'No se pudo aprobar.';
        this.toastService.showError('Error', errorMessage);
      }
    });
  }

  // Cargar historial de versiones
  loadVersiones(): void {
    if (!this.asignacion) return;

    this.loadingVersiones = true;
    this.grupoAsignaturaDocenteService.getVersiones(this.asignacion.id_grupo_asignatura_docente).subscribe({
      next: (versiones) => {
        this.versiones = versiones;
        this.loadingVersiones = false;
        this.showHistorialModal = true;
      },
      error: (err) => {
        this.loadingVersiones = false;
        this.toastService.showError('Error', 'No se pudo cargar el historial de versiones.');
        console.error('Error loading versiones:', err);
      }
    });
  }

  // Comparar versiones
  onCompararVersiones(): void {
    if (!this.asignacion || !this.version1Selected || !this.version2Selected) {
      this.toastService.showWarn('Selección requerida', 'Por favor selecciona dos versiones para comparar.');
      return;
    }

    this.loading = true;
    this.grupoAsignaturaDocenteService.compareVersiones(
      this.asignacion.id_grupo_asignatura_docente,
      this.version1Selected,
      this.version2Selected
    ).subscribe({
      next: (comparacion) => {
        this.comparacionResult = comparacion;
        this.loading = false;
        this.showCompararModal = true;
      },
      error: (err) => {
        this.loading = false;
        this.toastService.showError('Error', 'No se pudo comparar las versiones.');
        console.error('Error comparing versiones:', err);
      }
    });
  }

  // Restaurar versión
  onRestaurarVersion(versionId: number): void {
    if (!this.asignacion) return;

    this.confirmService.confirm({
      message: '¿Deseas restaurar esta versión? Se creará una nueva versión con los datos de la versión seleccionada.',
      header: 'Restaurar Versión',
      icon: 'pi pi-history',
      acceptCallback: () => {
        this.loading = true;
        this.grupoAsignaturaDocenteService.restaurarVersion(
          this.asignacion!.id_grupo_asignatura_docente,
          versionId
        ).subscribe({
          next: (asignacion) => {
            this.asignacion = asignacion;
            this.loading = false;
            this.toastService.showSuccess('Versión restaurada', 'Se ha restaurado la versión seleccionada.');
            this.loadVersiones();
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo restaurar la versión.';
            this.toastService.showError('Error', errorMessage);
          }
        });
      }
    });
  }

  // Obtener clase CSS para estado de aprobación
  getEstadoAprobacionClass(estado?: string): string {
    if (!estado) return 'estado-aprobacion-default';
    
    switch (estado) {
      case 'borrador':
        return 'estado-aprobacion-borrador';
      case 'pendiente_revision':
        return 'estado-aprobacion-pendiente';
      case 'revisada':
        return 'estado-aprobacion-revisada';
      case 'pendiente_aprobacion':
        return 'estado-aprobacion-pendiente-aprobacion';
      case 'aprobada':
        return 'estado-aprobacion-aprobada';
      case 'rechazada':
        return 'estado-aprobacion-rechazada';
      default:
        return 'estado-aprobacion-default';
    }
  }

  // Formatear fecha
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}