import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoAsignaturaDocenteService } from '../../services/grupo-asignatura-docente.service';
import { GrupoAsignaturaDocente, CargaDocenteVersion } from '../../models/grupo-asignatura-docente.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

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
  
  // Versionamiento
  versiones: CargaDocenteVersion[] = [];
  loadingVersiones = false;
  showHistorialModal = false;
  showCompararModal = false;
  version1Selected?: number;
  version2Selected?: number;
  comparacionResult: any = null;

  // Cache de roles
  private isCoordinadorCached: boolean = false;
  private isDirectorCached: boolean = false;
  private isAdministradorCached: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoAsignaturaDocenteService: GrupoAsignaturaDocenteService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadAsignacion();
    this.loadUserRoles();
  }

  // Cargar roles del usuario desde el backend
  loadUserRoles(): void {
    // Verificar coordinador
    this.authService.isCoordinadorAsync().subscribe({
      next: (isCoord) => {
        this.isCoordinadorCached = isCoord;
        console.log('Es coordinador:', isCoord);
      }
    });

    // Verificar director
    this.authService.isDirectorAsync().subscribe({
      next: (isDir) => {
        this.isDirectorCached = isDir;
        console.log('Es director:', isDir);
      }
    });

    // Verificar administrador
    this.authService.isAdministradorAsync().subscribe({
      next: (isAdmin) => {
        this.isAdministradorCached = isAdmin;
        console.log('Es administrador:', isAdmin);
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
        console.log('Usuario actual (token):', this.authService.getUserIdFromToken());
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

  // Verificar roles (usa cache y token)
  isCoordinador(): boolean {
    // Primero verificar desde el token (rápido)
    if (this.authService.isCoordinador()) {
      return true;
    }
    // Si no está en el token, usar el cache del backend
    return this.isCoordinadorCached;
  }

  isDirector(): boolean {
    // Primero verificar desde el token (rápido)
    if (this.authService.isDirector()) {
      return true;
    }
    // Si no está en el token, usar el cache del backend
    return this.isDirectorCached;
  }

  isAdministrador(): boolean {
    // Primero verificar desde el token (rápido)
    if (this.authService.isAdministrador()) {
      return true;
    }
    // Si no está en el token, usar el cache del backend
    return this.isAdministradorCached;
  }

  // Verificar si puede enviar a revisión (solo coordinador que creó)
  canEnviarRevision(): boolean {
    if (!this.asignacion) {
      console.log('canEnviarRevision: No hay asignación');
      return false;
    }

    if (!this.isCoordinador()) {
      console.log('canEnviarRevision: Usuario no es coordinador');
      return false;
    }

    if (this.asignacion.estado_aprobacion !== 'borrador') {
      console.log('canEnviarRevision: Estado no es borrador, es:', this.asignacion.estado_aprobacion);
      return false;
    }

    const userId = this.authService.getUserIdFromToken();
    const idCoordinador = this.asignacion.id_coordinador_carrera;

    console.log('canEnviarRevision - Debug:', {
      userId: userId,
      id_coordinador_carrera: idCoordinador,
      estado_aprobacion: this.asignacion.estado_aprobacion,
      asignacionCompleta: this.asignacion
    });

    // Si no hay id_coordinador_carrera, permitir si el usuario es coordinador y está en borrador
    // (el backend debería asignarlo automáticamente, pero por si acaso)
    if (!idCoordinador) {
      console.warn('canEnviarRevision: No hay id_coordinador_carrera, pero el usuario es coordinador y está en borrador. Permitir envío.');
      return true; // Permitir si es coordinador y está en borrador
    }

    // Comparación flexible: convertir ambos a número para evitar problemas de tipo
    const userIdNum = userId ? Number(userId) : null;
    const coordinadorNum = idCoordinador ? Number(idCoordinador) : null;

    const canSend = userIdNum !== null && coordinadorNum !== null && userIdNum === coordinadorNum;
    
    if (!canSend) {
      console.warn('canEnviarRevision: No coincide el coordinador. userId:', userIdNum, 'id_coordinador_carrera:', coordinadorNum);
      // Si no coincide pero el usuario es coordinador y está en borrador, permitir de todas formas
      // (puede ser que el backend no haya asignado correctamente el id_coordinador_carrera)
      console.warn('canEnviarRevision: Permitiendo envío porque usuario es coordinador y asignación está en borrador');
      return true;
    }

    return canSend;
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

    // Decodificar token para verificar expiración
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      if (now >= exp) {
        this.toastService.showError('Token expirado', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        this.authService.logOut();
        return;
      }
      console.log('Token válido. Usuario:', payload.username, 'Roles:', payload.roles);
    } catch (error) {
      console.error('Error decodificando token:', error);
    }

    this.confirmService.confirm({
      message: '¿Deseas enviar esta carga docente a revisión? El director de departamento podrá revisarla.',
      header: 'Enviar a Revisión',
      icon: 'pi pi-send',
      acceptCallback: () => {
        this.loading = true;
        console.log('Enviando a revisión. ID:', this.asignacion!.id_grupo_asignatura_docente);
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
            console.error('Error completo al enviar a revisión:', err);
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
  }

  // Revisar carga
  onRevisar(aprobado: boolean): void {
    if (!this.asignacion) return;

    const message = aprobado 
      ? '¿Deseas aprobar esta carga docente? Se creará una nueva versión.'
      : '¿Deseas rechazar esta carga docente? Volverá al estado borrador.';

    this.confirmService.confirm({
      message: message,
      header: aprobado ? 'Aprobar Revisión' : 'Rechazar Revisión',
      icon: aprobado ? 'pi pi-check-circle' : 'pi pi-times-circle',
      acceptCallback: () => {
        this.loading = true;
        this.grupoAsignaturaDocenteService.revisarCarga(
          this.asignacion!.id_grupo_asignatura_docente,
          { aprobado }
        ).subscribe({
          next: (asignacion) => {
            this.asignacion = asignacion;
            this.loading = false;
            const message = aprobado 
              ? 'La carga docente ha sido aprobada y se creó una nueva versión.'
              : 'La carga docente ha sido rechazada y volvió a borrador.';
            this.toastService.showSuccess(aprobado ? 'Aprobada' : 'Rechazada', message);
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo procesar la revisión.';
            this.toastService.showError('Error', errorMessage);
          }
        });
      }
    });
  }

  // Aprobar final
  onAprobarFinal(): void {
    if (!this.asignacion) return;

    this.confirmService.confirm({
      message: '¿Deseas dar la aprobación final a esta carga docente? Esta acción finaliza el proceso de aprobación.',
      header: 'Aprobación Final',
      icon: 'pi pi-check',
      acceptCallback: () => {
        this.loading = true;
        this.grupoAsignaturaDocenteService.aprobarFinal(
          this.asignacion!.id_grupo_asignatura_docente,
          {}
        ).subscribe({
          next: (asignacion) => {
            this.asignacion = asignacion;
            this.loading = false;
            this.toastService.showSuccess('Aprobación final', 'La carga docente ha sido aprobada definitivamente.');
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo aprobar.';
            this.toastService.showError('Error', errorMessage);
          }
        });
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