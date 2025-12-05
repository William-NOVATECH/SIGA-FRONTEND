import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del servicio de autenticación
    const token = this.authService.getToken();

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
        }
      }

      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.warn('JWT Interceptor - No hay token disponible para la petición:', request.url);
    }

    return next.handle(request);
  }
}