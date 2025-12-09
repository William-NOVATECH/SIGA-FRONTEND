import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router, 
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {

    console.log('AuthGuard - Verificando autenticación para ruta:', state.url);
    
    // Verificar si el usuario está autenticado (incluye verificación de token vencido)
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      console.warn('AuthGuard - Usuario no autenticado o token vencido, redirigiendo al login');
      console.warn('AuthGuard - Ruta bloqueada:', state.url);
      
      // Asegurarse de que la sesión esté completamente cerrada
      this.authService.logOut();
      
      // Retornar la URL del login
      return this.router.parseUrl("/auth/login");
    }

    console.log('AuthGuard - Usuario autenticado, permitiendo acceso');
    return true;
  }
}




