import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { loginRequest } from '../../auth/models/login-request';
import { registerRequest } from '../../auth/models/register-request';
import { Router } from '@angular/router';
import { Usuario } from '../../features/admin/interfaces/usuario.interface';

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
      return payload.userId || payload.sub || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
