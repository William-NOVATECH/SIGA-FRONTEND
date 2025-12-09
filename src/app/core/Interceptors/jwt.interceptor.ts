import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del servicio de autenticación
    const token = this.authService.getToken();

    // Verificar si el token está vencido antes de enviar la petición
    if (token && this.isTokenExpired(token)) {
      console.warn('JWT Interceptor - Token vencido detectado, cerrando sesión...');
      this.authService.logOut();
      return throwError(() => new Error('Token expirado'));
    }

    // Clonar la request y agregar el header Authorization si existe el token
    if (token) {
      // Log para debugging (solo en desarrollo)
      if (request.url.includes('enviar-revision')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT Interceptor - Enviando petición a:', request.url);
          console.log('JWT Interceptor - Usuario del token:', payload.username || payload.sub);
          console.log('JWT Interceptor - Roles del token:', payload.roles || payload.role || 'No hay roles');
        } catch (error) {
          console.error('JWT Interceptor - Error decodificando token:', error);
          // Si no se puede decodificar el token, está corrupto
          this.authService.logOut();
          return throwError(() => new Error('Token inválido'));
        }
      }

      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      // Si no hay token y no es una ruta pública, no agregar el header
      // El guard se encargará de redirigir si es necesario
      if (!this.isPublicRoute(request.url)) {
        console.warn('JWT Interceptor - No hay token disponible para la petición:', request.url);
        // No cerrar sesión aquí, dejar que el guard lo maneje para evitar bucles
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar errores de autenticación (401 Unauthorized)
        if (error.status === 401) {
          console.warn('JWT Interceptor - Error 401 (Unauthorized): Token inválido o vencido');
          this.handleAuthError('Tu sesión ha expirado o el token es inválido. Por favor, inicia sesión nuevamente.');
        }
        
        // Manejar errores de autorización (403 Forbidden) - también puede indicar token inválido
        if (error.status === 403) {
          // Solo cerrar sesión si el error es por token inválido, no por permisos
          const errorMessage = error.error?.message || error.message || '';
          if (errorMessage.toLowerCase().includes('token') || 
              errorMessage.toLowerCase().includes('expired') ||
              errorMessage.toLowerCase().includes('invalid')) {
            console.warn('JWT Interceptor - Error 403 (Forbidden): Token inválido o vencido');
            this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          }
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si el token está vencido
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si el token tiene fecha de expiración
      if (!payload.exp) {
        // Si no tiene exp, considerar que no está vencido (depende de la implementación del backend)
        return false;
      }

      // Comparar la fecha de expiración con la fecha actual
      const expirationDate = new Date(payload.exp * 1000); // exp está en segundos
      const now = new Date();
      
      // Agregar un margen de 30 segundos para evitar problemas de sincronización
      const margin = 30 * 1000; // 30 segundos en milisegundos
      
      return expirationDate.getTime() - margin < now.getTime();
    } catch (error) {
      console.error('JWT Interceptor - Error verificando expiración del token:', error);
      // Si hay error al decodificar, considerar el token como inválido
      return true;
    }
  }

  /**
   * Maneja errores de autenticación cerrando sesión y redirigiendo al login
   */
  private handleAuthError(message: string): void {
    console.log('JWT Interceptor - Cerrando sesión debido a error de autenticación');
    this.authService.logOut();
  }

  /**
   * Verifica si la ruta es pública (no requiere autenticación)
   */
  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/auth/login', '/auth/register', '/auth'];
    return publicRoutes.some(route => url.includes(route));
  }
}