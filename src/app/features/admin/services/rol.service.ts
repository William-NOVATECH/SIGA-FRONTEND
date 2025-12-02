import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Rol, 
  CreateRol, 
  UpdateRol, 
  QueryRol 
} from '../interfaces/rol.interface';
import { 
  Usuario,
  UsuarioRolResponse
} from '../interfaces/usuario.interface';
import { 
  AsignarRol,
  ActualizarRol 
} from '../interfaces/usuario-rol.interface';
import { PaginatedResponse } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = 'http://localhost:3000'; // URL base

  constructor(private http: HttpClient) {}

  // ========== CRUD DE ROLES ==========

  createRol(rolData: CreateRol): Observable<Rol> {
    return this.http.post<Rol>(`${this.apiUrl}/roles`, rolData);
  }

  getRoles(query?: QueryRol): Observable<PaginatedResponse<Rol> | Rol[]> {
    let params = new HttpParams();
    
    if (query) {
      if (query.search) params = params.set('search', query.search);
      if (query.nivel_acceso) params = params.set('nivel_acceso', query.nivel_acceso.toString());
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.orderBy) params = params.set('orderBy', query.orderBy);
      if (query.orderDirection) params = params.set('orderDirection', query.orderDirection);
    }

    return this.http.get<PaginatedResponse<Rol> | Rol[]>(`${this.apiUrl}/roles`, { params });
  }

  getRolById(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.apiUrl}/roles/${id}`);
  }

  getRolByNombre(nombre: string): Observable<Rol> {
    return this.http.get<Rol>(`${this.apiUrl}/roles/nombre/${nombre}`);
  }

  updateRol(id: number, rolData: UpdateRol): Observable<Rol> {
    return this.http.patch<Rol>(`${this.apiUrl}/roles/${id}`, rolData);
  }

  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${id}`);
  }

  // ========== GESTIÓN DE USUARIOS Y ROLES ==========

  // Obtener todos los usuarios con roles - usando tu endpoint exacto
  getUsuariosConRoles(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuario/with-roles`);
  }

  // Obtener todos los usuarios (sin roles)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuario`);
  }

  // Obtener usuario específico con roles
  getUsuarioConRoles(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuario/${id}/with-roles`);
  }

  // Obtener roles de un usuario específico
  getRolesDeUsuario(id: number): Observable<UsuarioRolResponse[]> {
    return this.http.get<UsuarioRolResponse[]>(`${this.apiUrl}/usuario/${id}/roles`);
  }

  // Asignar rol a usuario - usando tu endpoint exacto
  asignarRol(idUsuario: number, asignacion: AsignarRol): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuario/${idUsuario}/roles`, asignacion);
  }

  // Actualizar rol de usuario - usando tu endpoint exacto
  actualizarRolUsuario(idUsuario: number, idUsuarioRol: number, datos: ActualizarRol): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuario/${idUsuario}/roles/${idUsuarioRol}`, datos);
  }

  // Remover rol de usuario - usando tu endpoint exacto
  removerRolUsuario(idUsuario: number, idUsuarioRol: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuario/${idUsuario}/roles/${idUsuarioRol}`);
  }
}