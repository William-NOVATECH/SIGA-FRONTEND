import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { loginRequest } from '../../auth/models/login-request';
import { registerRequest } from '../../auth/models/register-request';
import { Router } from '@angular/router';
import { Usuario, UsuarioRolResponse } from '../../features/admin/interfaces/usuario.interface';

export interface LoginResponse {
  access_token: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private nestJsUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  registerUser(registerDto: registerRequest): Observable<any> {
    return this.http.post<any>(`${this.nestJsUrl}/auth/register`, registerDto)
      .pipe(
        catchError((error) => {
          let errorMessage = 'Error al registrar usuario';
          
          if (error.status === 400) {
            errorMessage = error.error.message || 'Datos inválidos';
          } else if (error.status === 409) {
            errorMessage = 'El usuario o email ya existe';
          }
          
          return throwError(error);
        })
      );
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.nestJsUrl}/auth/login`, {
      username: username,
      password: password,
    }).pipe(
      tap((response) => {
        // Guardar el token automáticamente cuando el login es exitoso
        if (response.access_token) {
          this.setToken(response.access_token);
        }
        // Guardar información del usuario si viene en la respuesta
        if (response.user) {
          this.setCurrentUser(response.user);
        }
      }),
      catchError((error) => {
        if (error.status === 401) {

        } else if (error.status === 400) {

        } else {

        }
        return throwError(error);
      })
    );
  }

  // Método para guardar el token
  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public removeToken(): void {
    localStorage.removeItem('token');
  }

  // Método para guardar el usuario actual
  private setCurrentUser(user: any): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Método para obtener el usuario actual
  public getCurrentUser(): Usuario | null {
    // Primero intentar obtener desde localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    // Si no hay usuario guardado, intentar obtener desde el token
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Crear objeto usuario desde el token
        const user: Usuario = {
          id_usuario: payload.userId || payload.sub || 0,
          username: payload.username || '',
          email: payload.email || '',
          estado: payload.estado || 'activo',
          fecha_creacion: payload.fecha_creacion ? new Date(payload.fecha_creacion) : new Date()
        };
        // Guardar para futuras consultas
        this.setCurrentUser(user);
        return user;
      } catch (error) {
        console.error('Error decoding user from token:', error);
      }
    }

    return null;
  }

  // Método para obtener el usuario desde el backend (si hay endpoint)
  public fetchCurrentUser(): Observable<Usuario | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // Intentar obtener desde el endpoint del backend
    return this.http.get<Usuario>(`${this.nestJsUrl}/auth/profile`).pipe(
      tap((user) => {
        // Guardar el usuario obtenido
        this.setCurrentUser(user);
      }),
      catchError((error) => {
        console.error('Error fetching current user:', error);
        // Si falla, retornar el usuario del localStorage o token
        return of(this.getCurrentUser());
      })
    );
  }

  // Método para obtener las iniciales del usuario
  public getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) {
      return 'U';
    }

    // Obtener iniciales del username o email
    const name = user.username || user.email || '';
    const parts = name.trim().split(/\s+/);
    
    if (parts.length >= 2) {
      // Si tiene nombre y apellido, tomar primera letra de cada uno
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      // Si solo tiene un nombre, tomar las primeras dos letras
      return parts[0].substring(0, 2).toUpperCase();
    } else if (name.length > 0) {
      // Si solo tiene una letra, duplicarla
      return (name[0] + name[0]).toUpperCase();
    }

    return 'U';
  }

  public removeCurrentUser(): void {
    localStorage.removeItem('currentUser');
  }

  public logOut(): void {
    this.removeToken();
    this.removeCurrentUser();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Método para obtener información del usuario desde el token (opcional)
  public getUserIdFromToken(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Intentar múltiples campos comunes donde puede estar el ID
      const userId = payload.userId || 
                     payload.sub || 
                     payload.id || 
                     payload.id_usuario || 
                     payload.user?.id || 
                     payload.user?.id_usuario;
      
      if (userId) {
        return Number(userId);
      }
      
      console.warn('getUserIdFromToken: No se encontró userId en el token. Payload:', payload);
      return null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Método para obtener los roles del usuario desde el token
  public getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch (error) {
      console.error('Error decoding roles from token:', error);
      return [];
    }
  }

  // Método para obtener el usuario actual con sus roles desde el backend
  public fetchCurrentUserWithRoles(): Observable<Usuario | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // Obtener el ID del usuario actual desde el token
    const userId = this.getUserIdFromToken();
    if (!userId) {
      console.warn('fetchCurrentUserWithRoles: No se pudo obtener el ID del usuario desde el token');
      return of(null);
    }

    console.log('fetchCurrentUserWithRoles: Obteniendo usuario con ID:', userId);

    // Usar el endpoint específico para obtener el usuario con su rol activo
    return this.http.get<Usuario>(`${this.nestJsUrl}/usuario/${userId}/with-roles`).pipe(
      map((currentUser: Usuario) => {
        console.log('fetchCurrentUserWithRoles: ✅ Usuario recibido del backend:', {
          id: currentUser.id_usuario,
          username: currentUser.username,
          email: currentUser.email,
          tieneRol: !!currentUser.rol,
          tieneRoles: !!currentUser.roles,
          cantidadRoles: currentUser.roles?.length || 0,
          estructuraRol: currentUser.rol ? {
            id_usuario_rol: currentUser.rol.id_usuario_rol,
            estado: currentUser.rol.estado,
            tieneRolAnidado: !!currentUser.rol.rol,
            rolInfo: currentUser.rol.rol ? {
              id_rol: currentUser.rol.rol.id_rol,
              nombre_rol: currentUser.rol.rol.nombre_rol,
              descripcion: currentUser.rol.rol.descripcion,
              nivel_acceso: currentUser.rol.rol.nivel_acceso
            } : null
          } : null,
          rolesArray: currentUser.roles ? currentUser.roles.map(r => ({
            id_usuario_rol: r.id_usuario_rol,
            estado: r.estado,
            nombre_rol: r.rol?.nombre_rol
          })) : []
        });
        
        // Guardar el usuario con roles
        this.setCurrentUser(currentUser);
        return currentUser;
      }),
      catchError((error) => {
        console.error('fetchCurrentUserWithRoles: ❌ Error obteniendo usuario con roles:', error);
        return of(null);
      })
    );
  }

  // Método para obtener el rol principal del usuario actual desde el backend
  public getCurrentUserRole(): Observable<string | null> {
    return this.fetchCurrentUserWithRoles().pipe(
      map((user: Usuario | null) => {
        if (!user) {
          console.log('getCurrentUserRole: ❌ Usuario no encontrado');
          return null;
        }

        console.log('getCurrentUserRole: Procesando usuario:', {
          id: user.id_usuario,
          username: user.username,
          tieneRol: !!user.rol,
          tieneRoles: !!user.roles,
          cantidadRoles: user.roles?.length || 0
        });

        // Prioridad 1: Usar el campo 'rol' (singular) - si el backend lo devuelve directamente
        // Estructura: user.rol.rol.nombre_rol
        if (user.rol) {
          // Verificar que el rol esté activo y tenga la estructura correcta
          if (user.rol.estado === 'activo') {
            if (user.rol.rol && user.rol.rol.nombre_rol) {
              const nombreRol = user.rol.rol.nombre_rol;
              console.log('getCurrentUserRole: ✅ Rol activo encontrado (campo rol):', nombreRol);
              return nombreRol;
            } else {
              console.warn('getCurrentUserRole: ⚠️ Rol encontrado pero no tiene estructura completa:', user.rol);
            }
          } else {
            console.warn('getCurrentUserRole: ⚠️ Rol encontrado pero no está activo. Estado:', user.rol.estado);
          }
        }

        // Prioridad 2: Usar el campo 'roles' (array) - estructura del endpoint /usuario/{id}/with-roles
        // Buscar el primer rol activo en el array
        if (user.roles && user.roles.length > 0) {
          console.log('getCurrentUserRole: Buscando rol activo en array de roles...');
          const activeRoles = user.roles.filter((r: UsuarioRolResponse) => r.estado === 'activo');
          
          if (activeRoles.length > 0) {
            const activeRole = activeRoles[0];
            if (activeRole && activeRole.rol && activeRole.rol.nombre_rol) {
              const nombreRol = activeRole.rol.nombre_rol;
              console.log('getCurrentUserRole: ✅ Rol activo encontrado (campo roles):', nombreRol);
              return nombreRol;
            } else {
              console.warn('getCurrentUserRole: ⚠️ Rol activo encontrado pero sin nombre:', activeRole);
            }
          } else {
            // Usuario tiene roles pero todos están inactivos
            const inactivos = user.roles.filter((r: UsuarioRolResponse) => r.estado === 'inactivo');
            if (inactivos.length > 0) {
              const rolInactivo = inactivos[0];
              console.warn('getCurrentUserRole: ⚠️ Usuario tiene rol pero está INACTIVO:', {
                nombre_rol: rolInactivo.rol?.nombre_rol,
                estado: rolInactivo.estado,
                id_usuario_rol: rolInactivo.id_usuario_rol,
                mensaje: 'El rol existe pero necesita ser activado por un administrador'
              });
            } else {
              console.warn('getCurrentUserRole: ⚠️ Usuario tiene roles pero ninguno está activo. Roles disponibles:', 
                user.roles.map((r: UsuarioRolResponse) => ({
                  id_usuario_rol: r.id_usuario_rol,
                  nombre_rol: r.rol?.nombre_rol,
                  estado: r.estado
                }))
              );
            }
          }
        } else {
          console.log('getCurrentUserRole: ℹ️ Usuario no tiene roles asignados');
        }

        console.log('getCurrentUserRole: ❌ Usuario sin rol activo - retornando null');
        return null;
      })
    );
  }

  // Método para obtener información sobre roles inactivos del usuario
  public getUserInactiveRole(): Observable<{ nombre_rol: string; id_usuario_rol: number } | null> {
    return this.fetchCurrentUserWithRoles().pipe(
      map((user: Usuario | null) => {
        if (!user) {
          return null;
        }

        // Buscar roles inactivos en el array
        if (user.roles && user.roles.length > 0) {
          const inactivos = user.roles.filter((r: UsuarioRolResponse) => r.estado === 'inactivo');
          if (inactivos.length > 0) {
            const rolInactivo = inactivos[0];
            if (rolInactivo.rol && rolInactivo.rol.nombre_rol) {
              return {
                nombre_rol: rolInactivo.rol.nombre_rol,
                id_usuario_rol: rolInactivo.id_usuario_rol
              };
            }
          }
        }

        // También verificar el campo 'rol' singular si está inactivo
        if (user.rol && user.rol.estado === 'inactivo' && user.rol.rol && user.rol.rol.nombre_rol) {
          return {
            nombre_rol: user.rol.rol.nombre_rol,
            id_usuario_rol: user.rol.id_usuario_rol
          };
        }

        return null;
      }),
      catchError((error) => {
        console.error('getUserInactiveRole: Error obteniendo rol inactivo:', error);
        return of(null);
      })
    );
  }

  // Método para obtener todos los roles activos del usuario
  public getActiveRoles(): Observable<string[]> {
    return this.fetchCurrentUserWithRoles().pipe(
      map((user: Usuario | null) => {
        if (!user) {
          return [];
        }

        const activeRoles: string[] = [];

        // Prioridad 1: Usar el campo 'rol' (singular) - si el backend lo devuelve directamente
        // Estructura: user.rol.rol.nombre_rol
        if (user.rol && user.rol.estado === 'activo' && user.rol.rol && user.rol.rol.nombre_rol) {
          activeRoles.push(user.rol.rol.nombre_rol);
          console.log('getActiveRoles: ✅ Rol agregado desde campo "rol":', user.rol.rol.nombre_rol);
        }

        // Prioridad 2: Usar el campo 'roles' (array) - estructura del endpoint /usuario/{id}/with-roles
        if (user.roles && user.roles.length > 0) {
          const rolesFromArray = user.roles
            .filter((r: UsuarioRolResponse) => r.estado === 'activo')
            .map((r: UsuarioRolResponse) => r.rol?.nombre_rol)
            .filter((nombre: string | undefined) => nombre !== undefined) as string[];
          
          // Agregar roles del array que no estén ya en la lista
          rolesFromArray.forEach(role => {
            if (!activeRoles.includes(role)) {
              activeRoles.push(role);
              console.log('getActiveRoles: ✅ Rol agregado desde campo "roles":', role);
            }
          });
        }

        console.log('getActiveRoles: ✅ Roles activos encontrados:', activeRoles);
        return activeRoles;
      }),
      catchError((error) => {
        console.error('getActiveRoles: ❌ Error obteniendo roles activos:', error);
        return of([]);
      })
    );
  }

  // Cache para el rol del usuario desde el backend
  private cachedUserRole: string | null = null;
  private roleCacheTimestamp: number = 0;
  private readonly ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Método para obtener el rol del usuario desde el backend (con cache)
  private getUserRoleFromBackend(): Observable<string | null> {
    const now = Date.now();
    // Si hay cache válido, retornarlo
    if (this.cachedUserRole && (now - this.roleCacheTimestamp) < this.ROLE_CACHE_DURATION) {
      return of(this.cachedUserRole);
    }

    // Obtener desde el backend
    return this.getCurrentUserRole().pipe(
      tap((role) => {
        if (role) {
          this.cachedUserRole = role;
          this.roleCacheTimestamp = now;
        }
      })
    );
  }

  // Método para verificar si el usuario tiene un rol específico
  public hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role.toUpperCase()) || roles.includes(role.toLowerCase());
  }

  // Método para verificar si el usuario tiene un rol específico (incluyendo backend)
  public hasRoleFromBackend(roleName: string): Observable<boolean> {
    // Primero intentar desde el token
    if (this.hasRole(roleName)) {
      return of(true);
    }

    // Si no está en el token, intentar desde el backend
    return this.getUserRoleFromBackend().pipe(
      map((role) => {
        if (!role) return false;
        const normalizedRole = role.toLowerCase();
        const normalizedSearch = roleName.toLowerCase();
        return normalizedRole.includes(normalizedSearch) || normalizedSearch.includes(normalizedRole);
      }),
      catchError(() => of(false))
    );
  }

  // Método para verificar si el usuario es coordinador (síncrono - desde token)
  public isCoordinador(): boolean {
    return this.hasRole('COORDINADOR') || this.hasRole('coordinador');
  }

  // Método para verificar si el usuario es coordinador (incluyendo backend, solo roles activos)
  public isCoordinadorAsync(): Observable<boolean> {
    // Verificar desde el backend (solo roles activos)
    return this.getActiveRoles().pipe(
      map((roles) => {
        const isCoord = roles.some(role => {
          const normalized = role.toLowerCase();
          return normalized === 'coordinador' || normalized.includes('coordinador');
        });
        console.log('isCoordinadorAsync: Verificación desde backend (solo activos):', isCoord, 'Roles activos:', roles);
        return isCoord;
      }),
      catchError((error) => {
        console.error('Error verificando si es coordinador:', error);
        // Fallback: verificar desde token si falla el backend
        return of(this.isCoordinador());
      })
    );
  }

  // Método para verificar si el usuario es director (síncrono - desde token)
  public isDirector(): boolean {
    return this.hasRole('DIRECTORES') || this.hasRole('directores') || this.hasRole('DIRECTOR') || this.hasRole('director');
  }

  // Método para verificar si el usuario es director (incluyendo backend, solo roles activos)
  public isDirectorAsync(): Observable<boolean> {
    // Verificar desde el backend (solo roles activos)
    return this.getActiveRoles().pipe(
      map((roles) => {
        const isDir = roles.some(role => {
          const normalized = role.toLowerCase();
          return normalized === 'director' || normalized === 'directores' || normalized.includes('director');
        });
        console.log('isDirectorAsync: Verificación desde backend (solo activos):', isDir, 'Roles activos:', roles);
        return isDir;
      }),
      catchError((error) => {
        console.error('Error verificando si es director:', error);
        // Fallback: verificar desde token si falla el backend
        return of(this.isDirector());
      })
    );
  }

  // Método para verificar si el usuario es administrador (síncrono - desde token)
  public isAdministrador(): boolean {
    return this.hasRole('ADMINISTRADOR') || this.hasRole('administrador') || this.hasRole('ADMIN') || this.hasRole('admin');
  }

  // Método para verificar si el usuario es administrador (incluyendo backend, solo roles activos)
  public isAdministradorAsync(): Observable<boolean> {
    // Verificar desde el backend (solo roles activos)
    return this.getActiveRoles().pipe(
      map((roles) => {
        const isAdmin = roles.some(role => {
          const normalized = role.toLowerCase();
          return normalized === 'administrador' || normalized === 'admin' || normalized.includes('administrador');
        });
        console.log('isAdministradorAsync: Verificación desde backend (solo activos):', isAdmin, 'Roles activos:', roles);
        return isAdmin;
      }),
      catchError((error) => {
        console.error('Error verificando si es administrador:', error);
        // Fallback: verificar desde token si falla el backend
        return of(this.isAdministrador());
      })
    );
  }
}
