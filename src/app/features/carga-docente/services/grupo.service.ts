import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Grupo } from '../models/carga-docente.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private nestJsUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(this.nestJsUrl).pipe(
      catchError(error => {
        console.error('Error al cargar grupos:', error);
        return of([]);
      })
    );
  }

  findWithAsignatura(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.nestJsUrl}/con-asignatura`).pipe(
      catchError(error => {
        console.warn('Endpoint con asignatura no disponible, usando findAll');
        return this.findAll();
      })
    );
  }

  findOne(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.nestJsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error al cargar grupo ${id}:`, error);
        // Retornar un objeto Grupo válido
        return of({
          id_grupo: id,
          codigo_grupo: `GRUPO-${id}`,
          nombre_grupo: `Grupo ${id}`,
          estado: 'inactivo',
          asignatura: {
            id_asignatura: 0,
            nombre_asignatura: 'No disponible',
            codigo_asignatura: 'N/A'
          }
        } as Grupo);
      })
    );
  }
}