import { Component, Input } from '@angular/core';
import { GrupoAsignaturaDocente } from '../../models/grupo-asignatura-docente.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-versionamiento-flow',
  standalone: false,
  templateUrl: './versionamiento-flow.component.html',
  styleUrls: ['./versionamiento-flow.component.css']
})
export class VersionamientoFlowComponent {
  @Input() asignacion?: GrupoAsignaturaDocente;

  constructor(public authService: AuthService) {}

  getEstadoAprobacion(): string {
    return this.asignacion?.estado_aprobacion || 'sin_estado';
  }

  getVersionActual(): number {
    return this.asignacion?.version_actual || 0;
  }

  // Obtener el paso actual del flujo
  getPasoActual(): number {
    const estado = this.getEstadoAprobacion();
    switch (estado) {
      case 'borrador': return 1;
      case 'pendiente_revision': return 2;
      case 'revisada': return 3;
      case 'pendiente_aprobacion': return 3;
      case 'aprobada': return 4;
      case 'rechazada': return 0; // Rechazada vuelve al inicio
      default: return 0;
    }
  }

  // Verificar si un paso está completado
  isPasoCompletado(paso: number): boolean {
    return this.getPasoActual() > paso;
  }

  // Verificar si es el paso actual
  isPasoActual(paso: number): boolean {
    return this.getPasoActual() === paso;
  }

  // Obtener información del paso
  getPasoInfo(paso: number): { titulo: string; descripcion: string; rol: string; icono: string } {
    const pasos = {
      1: {
        titulo: 'Creación Inicial',
        descripcion: 'El Coordinador de Carrera crea la asignación inicial de carga docente.',
        rol: 'Coordinador de Carrera',
        icono: 'fa-user-tie'
      },
      2: {
        titulo: 'Revisión',
        descripcion: 'El Director de Departamento revisa y valida la propuesta del Coordinador.',
        rol: 'Director de Departamento',
        icono: 'fa-user-check'
      },
      3: {
        titulo: 'Aprobación Final',
        descripcion: 'El Administrador (con rol de Director) da la aprobación final a la carga docente.',
        rol: 'Administrador',
        icono: 'fa-user-shield'
      },
      4: {
        titulo: 'Aprobada',
        descripcion: 'La carga docente ha sido completamente aprobada y está lista para uso.',
        rol: 'Sistema',
        icono: 'fa-check-double'
      }
    };
    return pasos[paso as keyof typeof pasos] || pasos[1];
  }

  // Obtener explicación del rol actual
  getExplicacionRol(): string {
    const estado = this.getEstadoAprobacion();
    const esCoordinador = this.authService.isCoordinador();
    const esDirector = this.authService.isDirector();
    const esAdministrador = this.authService.isAdministrador();

    switch (estado) {
      case 'borrador':
        if (esCoordinador) {
          const userId = this.authService.getUserIdFromToken();
          const esCreador = this.asignacion?.id_coordinador_carrera === userId;
          if (esCreador) {
            return 'Como Coordinador de Carrera, puedes revisar y editar esta asignación. Cuando esté lista, haz clic en el botón "Enviar a Revisión" que aparece debajo del flujo para enviarla al Director de Departamento.';
          } else {
            return 'Esta asignación está en borrador. Solo el Coordinador que la creó puede enviarla a revisión.';
          }
        }
        return 'Esta asignación está en borrador. El Coordinador de Carrera puede enviarla a revisión cuando esté lista usando el botón "Enviar a Revisión".';
      
      case 'pendiente_revision':
        if (esDirector) {
          return 'Como Director de Departamento, debes revisar esta asignación. Puedes aprobarla, rechazarla o solicitar cambios.';
        }
        if (esCoordinador) {
          return 'Tu asignación está en revisión. El Director de Departamento la está evaluando.';
        }
        return 'Esta asignación está pendiente de revisión por el Director de Departamento.';
      
      case 'revisada':
        if (esAdministrador) {
          return 'Como Administrador, debes dar la aprobación final a esta asignación que ya fue revisada por el Director.';
        }
        return 'Esta asignación ha sido revisada y está pendiente de aprobación final por el Administrador.';
      
      case 'pendiente_aprobacion':
        if (esAdministrador) {
          return 'Como Administrador, debes dar la aprobación final a esta asignación.';
        }
        return 'Esta asignación está pendiente de aprobación final por el Administrador.';
      
      case 'aprobada':
        return 'Esta asignación ha sido completamente aprobada y está lista para uso.';
      
      case 'rechazada':
        return 'Esta asignación fue rechazada. El Coordinador de Carrera debe revisarla y hacer los cambios necesarios.';
      
      default:
        return 'Esta asignación no tiene un estado de aprobación definido.';
    }
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'borrador': 'estado-borrador',
      'pendiente_revision': 'estado-pendiente',
      'revisada': 'estado-revisada',
      'pendiente_aprobacion': 'estado-pendiente-final',
      'aprobada': 'estado-aprobada',
      'rechazada': 'estado-rechazada',
      'sin_estado': 'estado-sin-estado'
    };
    return estados[estado] || 'estado-default';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoAprobacionLabel(): string {
    const estado = this.getEstadoAprobacion();
    const labels: { [key: string]: string } = {
      'borrador': 'Borrador',
      'pendiente_revision': 'Pendiente Revisión',
      'revisada': 'Revisada',
      'pendiente_aprobacion': 'Pendiente Aprobación',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada',
      'sin_estado': 'Sin Estado'
    };
    return labels[estado] || estado;
  }
}

