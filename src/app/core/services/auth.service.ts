import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { loginRequest } from '../../auth/models/login-request';
import { registerRequest } from '../../auth/models/register-request';
import { Router } from '@angular/router';

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
    private messageService: MessageService,
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
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error en registro',
            detail: errorMessage
          });
          
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
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Inicio de sesión exitoso'
          });
        }
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Credenciales inválidas'
          });
        } else if (error.status === 400) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Datos inválidos'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error del servidor. Intente más tarde.'
          });
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

  public logOut(): void {
    this.removeToken();
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
