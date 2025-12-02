import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grupo, CreateGrupoDto, UpdateGrupoDto, QueryGrupoDto, PaginatedResponse } from '../models/grupo.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private apiUrl = 'http://localhost:3000/grupos';

  constructor(private http: HttpClient) {}

  create(grupo: CreateGrupoDto): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, grupo);
  }

  findAll(query?: QueryGrupoDto): Observable<Grupo[] | PaginatedResponse<Grupo>> {
    let params = new HttpParams();
    
    if (query) {
      Object.keys(query).forEach(key => {
        const value = query[key as keyof QueryGrupoDto];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Grupo[] | PaginatedResponse<Grupo>>(this.apiUrl, { params });
  }

  findOne(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/${id}`);
  }

  findByCodigo(codigo: string): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/codigo/${codigo}`);
  }

  findByCarrera(idCarrera: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/carrera/${idCarrera}`);
  }

  findByPeriodo(periodo: string): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/periodo/${periodo}`);
  }

  findByEstado(estado: string): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/estado/${estado}`);
  }

  update(id: number, updateDto: UpdateGrupoDto): Observable<Grupo> {
    return this.http.patch<Grupo>(`${this.apiUrl}/${id}`, updateDto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}