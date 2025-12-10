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

  // Cache de roles por ID
  private activeRoleId: number | null = null;
  private isCoordinadorCached: boolean = false; // id_rol: 2
  private isJefeDepartamentoCached: boolean = false; // id_rol: 1
  private isDirectorDepartamentoCached: boolean = false; // id_rol: 5

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
    
    // Log de depuración después de un breve delay para verificar estado
    setTimeout(() => {
      console.log('📊 ESTADO INICIAL DEL COMPONENTE:');
      console.log('- activeRoleId:', this.activeRoleId);
      console.log('- isJefeDepartamentoCached:', this.isJefeDepartamentoCached);
      console.log('- asignacion?.estado_aprobacion:', this.asignacion?.estado_aprobacion);
      console.log('- canRevisar():', this.canRevisar());
    }, 1000);
  }

  // Cargar roles del usuario desde el backend usando id_rol
  loadUserRoles(): void {
    // Obtener el id_rol activo del usuario desde el backend
    this.authService.getActiveRoleId().subscribe({
      next: (roleId) => {
        this.activeRoleId = roleId;
        
        if (roleId !== null) {
          console.log('ID de rol obtenido del backend:', roleId);
          
          // Actualizar cache de roles basado en id_rol
          // id_rol: 2 = Coordinador de carrera
          // id_rol: 1 = Jefe departamento
          // id_rol: 5 = Director departamento
          this.isCoordinadorCached = roleId === 2;
          this.isJefeDepartamentoCached = roleId === 1;
          this.isDirectorDepartamentoCached = roleId === 5;
          
          console.log('Roles actualizados por ID:', {
            id_rol: roleId,
            esCoordinador: this.isCoordinadorCached,
            esJefeDepartamento: this.isJefeDepartamentoCached,
            esDirectorDepartamento: this.isDirectorDepartamentoCached
          });
        } else {
          console.warn('No se pudo obtener el id_rol del backend');
          // Limpiar cache
          this.isCoordinadorCached = false;
          this.isJefeDepartamentoCached = false;
          this.isDirectorDepartamentoCached = false;
        }
      },
      error: (error) => {
        console.error('Error obteniendo id_rol del backend:', error);
        // Limpiar cache en caso de error
        this.activeRoleId = null;
        this.isCoordinadorCached = false;
        this.isJefeDepartamentoCached = false;
        this.isDirectorDepartamentoCached = false;
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
        
        // Recargar roles del usuario para asegurar que tenemos el id_rol actualizado
        this.loadUserRoles();
        
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

  // Verificar roles usando id_rol (más confiable que nombre_rol)
  isCoordinador(): boolean {
    // Verificar por id_rol: 2 = Coordinador de carrera
    return this.isCoordinadorCached || this.activeRoleId === 2;
  }

  isJefeDepartamento(): boolean {
    // Verificar por id_rol: 1 = Jefe departamento
    const result = this.isJefeDepartamentoCached || this.activeRoleId === 1;
    
    // Si no tenemos el rol cargado y no está en cache, intentar recargarlo
    if (!result && this.activeRoleId === null && !this.loading) {
      console.log('⚠️ isJefeDepartamento: activeRoleId es null, recargando roles...');
      this.loadUserRoles();
    }
    
    return result;
  }

  isDirectorDepartamento(): boolean {
    // Verificar por id_rol: 5 = Director departamento
    // Priorizar activeRoleId si está disponible, luego el cache
    if (this.activeRoleId !== null && this.activeRoleId !== undefined) {
      return this.activeRoleId === 5;
    }
    return this.isDirectorDepartamentoCached;
  }

  // Mantener métodos legacy para compatibilidad (pero usarán id_rol internamente)
  isDirector(): boolean {
    return this.isDirectorDepartamento();
  }

  isAdministrador(): boolean {
    // No hay administrador en el nuevo flujo, pero mantenemos por compatibilidad
    return false;
  }

  // Verificar si puede enviar a revisión (solo coordinador id_rol: 2 que creó)
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

    // Verificar que el usuario sea coordinador (id_rol: 2)
    const isCoord = this.isCoordinador();
    if (!isCoord) {
      console.log('canEnviarRevision: Usuario no es coordinador (id_rol debe ser 2). id_rol actual:', this.activeRoleId);
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

  // Verificar si puede revisar (Jefe departamento id_rol: 1)
  canRevisar(): boolean {
    if (!this.asignacion) {
      console.log('canRevisar: No hay asignación');
      return false;
    }
    
    // Log detallado para debugging
    console.log('🔍 canRevisar - Verificación completa:', {
      tieneAsignacion: !!this.asignacion,
      estado_aprobacion: this.asignacion.estado_aprobacion,
      activeRoleId: this.activeRoleId,
      isJefeDepartamentoCached: this.isJefeDepartamentoCached,
      id_asignacion: this.asignacion.id_grupo_asignatura_docente
    });
    
    // Verificar que el usuario sea Jefe departamento (id_rol: 1)
    const isJefe = this.isJefeDepartamento();
    console.log('canRevisar - isJefeDepartamento():', isJefe, 'activeRoleId:', this.activeRoleId);
    
    if (!isJefe) {
      console.log('❌ canRevisar: Usuario no es Jefe departamento (id_rol debe ser 1). id_rol actual:', this.activeRoleId);
      // Intentar recargar el rol si no está disponible
      if (this.activeRoleId === null) {
        console.log('⚠️ activeRoleId es null, recargando roles...');
        this.loadUserRoles();
      }
      return false;
    }
    
    // Verificar que el estado sea pendiente_revision (después de que coordinador envíe)
    const estadoCorrecto = this.asignacion.estado_aprobacion === 'pendiente_revision';
    console.log('canRevisar - Estado correcto para revisar:', estadoCorrecto, 'estado_aprobacion:', this.asignacion.estado_aprobacion);
    
    if (!estadoCorrecto) {
      console.log('❌ canRevisar: Estado no es pendiente_revision. Estado actual:', this.asignacion.estado_aprobacion);
      return false;
    }
    
    console.log('✅ canRevisar: Usuario puede revisar - es Jefe departamento y estado es pendiente_revision');
    return true;
  }

  // Verificar si puede aprobar final (Director departamento id_rol: 5)
  canAprobarFinal(): boolean {
    if (!this.asignacion) {
      console.log('canAprobarFinal: No hay asignación');
      return false;
    }
    
    // Log detallado para debugging
    console.log('🔍 canAprobarFinal - Verificación completa:', {
      tieneAsignacion: !!this.asignacion,
      estado_aprobacion: this.asignacion.estado_aprobacion,
      activeRoleId: this.activeRoleId,
      isDirectorDepartamentoCached: this.isDirectorDepartamentoCached,
      id_asignacion: this.asignacion.id_grupo_asignatura_docente
    });
    
    // Verificar que el usuario sea Director departamento (id_rol: 5)
    const isDirector = this.isDirectorDepartamento();
    console.log('canAprobarFinal - isDirectorDepartamento():', isDirector, 'activeRoleId:', this.activeRoleId);
    
    if (!isDirector) {
      console.log('❌ canAprobarFinal: Usuario no es Director departamento (id_rol debe ser 5). id_rol actual:', this.activeRoleId);
      // Intentar recargar el rol si no está disponible
      if (this.activeRoleId === null) {
        console.log('⚠️ activeRoleId es null, recargando roles...');
        this.loadUserRoles();
      }
      return false;
    }
    
    // Verificar que el estado sea revisada o pendiente_aprobacion (después de que jefe departamento revise)
    const estadoCorrecto = this.asignacion.estado_aprobacion === 'revisada' || 
                          this.asignacion.estado_aprobacion === 'pendiente_aprobacion';
    console.log('canAprobarFinal - Estado correcto para aprobar:', estadoCorrecto, 'estado_aprobacion:', this.asignacion.estado_aprobacion);
    
    if (!estadoCorrecto) {
      console.log('❌ canAprobarFinal: Estado no es revisada o pendiente_aprobacion. Estado actual:', this.asignacion.estado_aprobacion);
      return false;
    }
    
    console.log('✅ canAprobarFinal: Usuario puede aprobar final - es Director departamento y estado es revisada/pendiente_aprobacion');
    return true;
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
        console.log('🔍 Análisis detallado de roles por ID:');
        console.log('- userWithRoles.roles (array):', userWithRoles.roles);
        console.log('- userWithRoles.rol (objeto):', userWithRoles.rol);
        
        // Obtener id_rol activo
        let activeRoleId: number | null = null;
        
        // Prioridad 1: Verificar en el array roles
        if (userWithRoles.roles && Array.isArray(userWithRoles.roles)) {
          const activeRole = userWithRoles.roles.find((r: any) => r.estado === 'activo');
          if (activeRole && activeRole.rol) {
            activeRoleId = activeRole.rol.id_rol;
            console.log(`  Rol activo encontrado en array: id_rol=${activeRoleId}, nombre=${activeRole.rol.nombre_rol}`);
          }
        }
        
        // Prioridad 2: Verificar en el objeto rol (singular)
        if (!activeRoleId && userWithRoles.rol && userWithRoles.rol.estado === 'activo' && userWithRoles.rol.rol) {
          activeRoleId = userWithRoles.rol.rol.id_rol;
          console.log(`  Rol activo encontrado en objeto: id_rol=${activeRoleId}, nombre=${userWithRoles.rol.rol.nombre_rol}`);
        }

        console.log('📊 RESUMEN DE VALIDACIÓN POR ID_ROL:');
        console.log({
          userId: userWithRoles.id_usuario,
          username: userWithRoles.username,
          id_rol_activo: activeRoleId,
          esCoordinador: activeRoleId === 2,
          id_coordinador_carrera: this.asignacion?.id_coordinador_carrera,
          asignacionId: this.asignacion?.id_grupo_asignatura_docente
        });

        // Verificar que el usuario tenga id_rol: 2 (Coordinador de carrera)
        if (activeRoleId !== 2) {
          this.toastService.showError('Sin permisos', `No tienes el rol de Coordinador de carrera (id_rol: 2) necesario para enviar a revisión. Tu id_rol actual: ${activeRoleId || 'N/A'}`);
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
          message: '¿Deseas enviar esta carga docente a revisión? El Jefe de departamento podrá revisarla.',
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

  // Abrir modal de revisión (solo para Jefe departamento id_rol: 1)
  onOpenRevisarModal(aprobado: boolean): void {
    if (!this.asignacion) return;

    // Validar que el usuario sea Jefe departamento (id_rol: 1)
    if (!this.isJefeDepartamento()) {
      this.toastService.showError('Sin permisos', 'Solo el Jefe de departamento (id_rol: 1) puede revisar asignaciones.');
      return;
    }

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

  // Confirmar y enviar revisión (solo para Jefe departamento id_rol: 1)
  onConfirmRevisar(): void {
    if (!this.asignacion) return;

    // Validar que el usuario sea Jefe departamento (id_rol: 1)
    if (!this.isJefeDepartamento()) {
      this.toastService.showError('Sin permisos', 'Solo el Jefe de departamento (id_rol: 1) puede revisar asignaciones.');
      return;
    }

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

  // Abrir modal de aprobación final (solo para Director departamento id_rol: 5)
  onOpenAprobarFinalModal(): void {
    if (!this.asignacion) return;

    // Validar que el usuario sea Director departamento (id_rol: 5)
    if (!this.isDirectorDepartamento()) {
      this.toastService.showError('Sin permisos', 'Solo el Director de departamento (id_rol: 5) puede dar la aprobación final.');
      return;
    }

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

  // Confirmar y enviar aprobación final (solo para Director departamento id_rol: 5)
  onConfirmAprobarFinal(): void {
    if (!this.asignacion) return;

    // Validar que el usuario sea Director departamento (id_rol: 5)
    if (!this.isDirectorDepartamento()) {
      this.toastService.showError('Sin permisos', 'Solo el Director de departamento (id_rol: 5) puede dar la aprobación final.');
      return;
    }

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

  // Restaurar versión (solo para Coordinador id_rol: 2 o Director departamento id_rol: 5)
  onRestaurarVersion(versionId: number): void {
    if (!this.asignacion) return;

    // Validar que el usuario sea Coordinador o Director departamento
    if (!this.isCoordinador() && !this.isDirectorDepartamento()) {
      this.toastService.showError('Sin permisos', 'Solo el Coordinador (id_rol: 2) o Director de departamento (id_rol: 5) pueden restaurar versiones.');
      return;
    }

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