import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  roles: number[]; // Array de id_rol que pueden ver este item
}

@Component({
  selector: 'app-navbar',
  standalone:false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  logoImage: string = 'assets/images/unan.png';
  userInitials: string = 'U';
  currentUser: any = null;
  userRoles: string[] = [];
  primaryRole: string = '';
  activeRoleId: number | null = null;
  menuItems: MenuItem[] = [];
  availableMenuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Verificar autenticación al inicializar el componente
    if (!this.authService.isAuthenticated()) {
      console.warn('NavbarComponent - Usuario no autenticado o token vencido, redirigiendo al login');
      this.authService.logOut();
      return;
    }

    this.initializeMenuItems();
    this.loadCurrentUser();
    this.loadUserRolesFromBackend();
    this.loadActiveRoleId();
  }

  initializeMenuItems() {
    // Definir todos los items del menú con sus roles permitidos
    this.menuItems = [
      {
        id: 'admin',
        title: 'Administración',
        icon: 'pi pi-briefcase',
        route: '/admin',
        roles: [1, 5] // Solo Jefe departamento (1) y Director departamento (5)
      },
      {
        id: 'roles',
        title: 'Roles',
        icon: 'pi pi-shield',
        route: '/admin/roles',
        roles: [1, 5] // Solo Jefe departamento (1) y Director departamento (5)
      },
      {
        id: 'inicio',
        title: 'Inicio',
        icon: 'pi pi-home',
        route: '/inicio',
        roles: [1, 2, 3, 5] // Todos excepto invitado (6)
      },
      {
        id: 'departamentos',
        title: 'Departamentos',
        icon: 'pi pi-folder',
        route: '/departamentos',
        roles: [1, 2, 5] // Jefe departamento, Coordinador, Director
      },
      {
        id: 'asignaturas',
        title: 'Asignaturas',
        icon: 'pi pi-file-edit',
        route: '/asignaturas',
        roles: [1, 2, 3, 5] // Todos excepto invitado
      },
      {
        id: 'carreras',
        title: 'Carreras',
        icon: 'pi pi-chart-bar',
        route: '/carreras',
        roles: [1, 2, 3, 5] // Todos excepto invitado
      },
      {
        id: 'grupos',
        title: 'Grupos',
        icon: 'pi pi-book',
        route: '/grupos',
        roles: [1, 2, 3, 5] // Todos excepto invitado
      },
      {
        id: 'docentes',
        title: 'Docentes',
        icon: 'pi pi-user',
        route: '/docentes',
        roles: [1, 2, 5] // Jefe departamento, Coordinador, Director
      },
      {
        id: 'carga-docente',
        title: 'Carga Docente',
        icon: 'pi pi-id-card',
        route: '/carga-docente',
        roles: [1, 2, 5] // Jefe departamento, Coordinador, Director
      },
      {
        id: 'planes',
        title: 'Planes',
        icon: 'pi pi-list',
        route: '/planes',
        roles: [1, 2, 5] // Jefe departamento, Coordinador, Director
      }
    ];
  }

  loadActiveRoleId() {
    this.authService.getActiveRoleId().subscribe({
      next: (roleId) => {
        this.activeRoleId = roleId;
        console.log('NavbarComponent - ID de rol activo:', roleId);
        this.filterMenuItemsByRole();
      },
      error: (error) => {
        console.error('NavbarComponent - Error obteniendo id_rol:', error);
        this.activeRoleId = null;
        this.availableMenuItems = [];
      }
    });
  }

  filterMenuItemsByRole() {
    if (this.activeRoleId === null) {
      // Si no hay rol activo, no mostrar items (probablemente invitado)
      this.availableMenuItems = [];
      return;
    }

    // Filtrar items según el rol del usuario
    this.availableMenuItems = this.menuItems.filter(item => 
      item.roles.includes(this.activeRoleId!)
    );

    console.log('NavbarComponent - Items del menú disponibles para rol', this.activeRoleId, ':', this.availableMenuItems.length);
  }

  loadCurrentUser() {
    // Intentar obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      this.userInitials = this.authService.getUserInitials();
    } else {
      // Si no hay usuario guardado, intentar obtenerlo del backend
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
            this.userInitials = this.authService.getUserInitials();
          }
        },
        error: (error) => {
          console.error('Error loading user:', error);
        }
      });
    }
  }

  loadUserRolesFromBackend() {
    // Intentar obtener el rol desde el backend usando el endpoint /usuario/with-roles
    this.authService.getCurrentUserRole().subscribe({
      next: (roleName) => {
        if (roleName) {
          this.primaryRole = this.getRoleDisplayName(roleName);
          console.log('Rol obtenido del backend:', roleName, '→', this.primaryRole);
        } else {
          console.warn('No se encontró rol en el backend, intentando desde token...');
          // Fallback: intentar obtener desde el token
          this.loadUserRolesFromToken();
        }
      },
      error: (error) => {
        console.error('Error obteniendo rol del backend:', error);
        // Fallback: intentar obtener desde el token
        this.loadUserRolesFromToken();
      }
    });
  }

  loadUserRolesFromToken() {
    // Intentar obtener roles del servicio (desde token)
    this.userRoles = this.authService.getUserRoles();
    console.log('Roles obtenidos del token:', this.userRoles);
    
    if (this.userRoles.length > 0) {
      // Obtener el rol principal (el primero o el más relevante)
      this.primaryRole = this.getRoleDisplayName(this.userRoles[0]);
      console.log('Rol principal desde token:', this.primaryRole);
    } else {
      console.warn('No se encontraron roles en el token');
    }
  }

  getRoleDisplayName(role: string): string {
    if (!role) return '';
    
    // Normalizar el rol (quitar espacios, convertir a minúsculas)
    const normalizedRole = role.trim().toLowerCase();
    
    const roleNames: { [key: string]: string } = {
      'coordinador': 'Coordinador de Carrera',
      'coordinador de carrera': 'Coordinador de Carrera',
      'jefe departamento': 'Jefe departamento',
      'jefe de departamento': 'Jefe departamento',
      'director': 'Director de Departamento',
      'director de departamento': 'Director de Departamento',
      'directores': 'Director de Departamento',
      'administrador': 'Administrador',
      'admin': 'Administrador',
      'docente': 'Docente',
      'docentes': 'Docente',
      'invitado': 'Invitado',
      'guest': 'Invitado'
    };
    
    // Buscar coincidencia exacta o parcial
    const displayName = roleNames[normalizedRole];
    if (displayName) {
      return displayName;
    }
    
    // Si no hay coincidencia, buscar si contiene alguna palabra clave
    for (const [key, value] of Object.entries(roleNames)) {
      if (normalizedRole.includes(key) || key.includes(normalizedRole)) {
        return value;
      }
    }
    
    // Si no hay coincidencia, capitalizar la primera letra
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  logOut() {
    this.authService.logOut();
  }
}