import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Module {
  id: string;
  title: string;
  icon: string;
  route: string;
  description?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone:false,
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  currentUser: any = null;
  userRole: string = '';
  userRoleName: string = '';
  availableModules: Module[] = [];
  loading: boolean = true;
  inactiveRole: { nombre_rol: string; id_usuario_rol: number } | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Obtener el rol del usuario desde el backend
    this.authService.getCurrentUserRole().subscribe({
      next: (roleName) => {
        if (roleName) {
          this.userRole = roleName.toLowerCase();
          this.userRoleName = this.getRoleDisplayName(roleName);
          this.availableModules = this.getModulesForRole(this.userRole);
          this.inactiveRole = null; // Limpiar rol inactivo si hay rol activo
          this.loading = false;
        } else {
          // Si no hay rol activo, verificar si hay rol inactivo
          this.authService.getUserInactiveRole().subscribe({
            next: (inactiveRole) => {
              if (inactiveRole) {
                // Usuario tiene rol pero está inactivo
                this.inactiveRole = inactiveRole;
                this.userRole = 'inactivo';
                this.userRoleName = this.getRoleDisplayName(inactiveRole.nombre_rol);
                this.availableModules = [];
              } else {
                // No hay rol activo ni inactivo, verificar token
                const roles = this.authService.getUserRoles();
                if (roles.length > 0) {
                  this.userRole = roles[0].toLowerCase();
                  this.userRoleName = this.getRoleDisplayName(roles[0]);
                  this.availableModules = this.getModulesForRole(this.userRole);
                } else {
                  // Si no hay rol, asumir invitado
                  this.userRole = 'invitado';
                  this.userRoleName = 'Invitado';
                  this.availableModules = this.getModulesForRole('invitado');
                }
              }
              this.loading = false;
            },
            error: () => {
              // Fallback: intentar obtener desde el token
              const roles = this.authService.getUserRoles();
              if (roles.length > 0) {
                this.userRole = roles[0].toLowerCase();
                this.userRoleName = this.getRoleDisplayName(roles[0]);
                this.availableModules = this.getModulesForRole(this.userRole);
              } else {
                this.userRole = 'invitado';
                this.userRoleName = 'Invitado';
                this.availableModules = this.getModulesForRole('invitado');
              }
              this.loading = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error obteniendo rol:', error);
        // Fallback a invitado si hay error
        this.userRole = 'invitado';
        this.userRoleName = 'Invitado';
        this.availableModules = this.getModulesForRole('invitado');
        this.loading = false;
      }
    });
  }

  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'invitado': 'Invitado',
      'docentes': 'Docente',
      'directores': 'Director de Departamento',
      'coordinador': 'Coordinador de Carrera',
      'administrador': 'Administrador'
    };
    return roleMap[role.toLowerCase()] || role;
  }

  getModulesForRole(role: string): Module[] {
    const normalizedRole = role.toLowerCase();
    
    // Definir módulos según el caso de uso
    const allModules: { [key: string]: Module[] } = {
      'invitado': [], // Sin módulos para invitados
      
      'docentes': [
        {
          id: 'informacion-biografica',
          title: 'Información Biográfica',
          icon: '👤',
          route: '/docentes',
          description: 'Agregar y editar tu información biográfica'
        },
        {
          id: 'evidencias',
          title: 'Evidencias',
          icon: '📄',
          route: '/docentes',
          description: 'Agregar y editar evidencias académicas'
        }
      ],
      
      'directores': [
        {
          id: 'carga-docente',
          title: 'Gestión Carga Docente',
          icon: '👨‍🏫',
          route: '/carga-docente',
          description: 'Generar y gestionar la carga docente'
        },
        {
          id: 'informacion-docentes',
          title: 'Información de Docentes',
          icon: '👨‍🎓',
          route: '/docentes',
          description: 'Visualizar información de docentes'
        },
        {
          id: 'reportes-docentes',
          title: 'Reportes de Docentes',
          icon: '📊',
          route: '/carga-docente',
          description: 'Visualizar reportes de actividades docentes'
        }
      ],
      
      'coordinador': [
        {
          id: 'carga-docente',
          title: 'Gestión Carga Docente',
          icon: '👨‍🏫',
          route: '/carga-docente',
          description: 'Generar y gestionar la carga docente'
        },
        {
          id: 'informacion-docentes',
          title: 'Información de Docentes',
          icon: '👨‍🎓',
          route: '/docentes',
          description: 'Visualizar información de docentes'
        },
        {
          id: 'reportes-docentes',
          title: 'Reportes de Docentes',
          icon: '📊',
          route: '/carga-docente',
          description: 'Visualizar reportes de actividades docentes'
        }
      ],
      
      'administrador': [
        {
          id: 'catalogos',
          title: 'Gestión de Catálogos',
          icon: '📋',
          route: '/admin',
          description: 'Agregar y editar información de catálogos (Departamentos, Carreras, Asignaturas, Planes)'
        },
        {
          id: 'carga-docente',
          title: 'Gestión Carga Docente',
          icon: '👨‍🏫',
          route: '/carga-docente',
          description: 'Generar y gestionar la carga docente'
        },
        {
          id: 'reporte-actividades',
          title: 'Reporte de Actividades Docentes',
          icon: '📈',
          route: '/carga-docente',
          description: 'Generar reportes de actividades docentes'
        },
        {
          id: 'informacion-docentes',
          title: 'Información de Docentes',
          icon: '👨‍🎓',
          route: '/docentes',
          description: 'Visualizar información de docentes'
        },
        {
          id: 'reportes-docentes',
          title: 'Reportes de Docentes',
          icon: '📊',
          route: '/carga-docente',
          description: 'Visualizar reportes de actividades docentes'
        },
        {
          id: 'administracion',
          title: 'Administración de Usuarios',
          icon: '💼',
          route: '/admin/usuarios',
          description: 'Gestionar usuarios y roles del sistema'
        }
      ]
    };

    return allModules[normalizedRole] || [];
  }

  goToModule(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logOut(); 
    this.router.navigate(['/auth/login']);
  }

  isInvitado(): boolean {
    return this.userRole === 'invitado';
  }

  hasInactiveRole(): boolean {
    return this.userRole === 'inactivo' && this.inactiveRole !== null;
  }

  getInactiveRoleName(): string {
    return this.inactiveRole ? this.getRoleDisplayName(this.inactiveRole.nombre_rol) : '';
  }
}
