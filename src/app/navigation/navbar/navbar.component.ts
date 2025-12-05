import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUserRolesFromBackend();
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