import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Docente } from '../models/carga-docente.model';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private nestJsUrl = `${environment.apiUrl}/docentes`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Docente[]> {
    return this.http.get<Docente[]>(this.nestJsUrl).pipe(
      catchError(error => {
        console.error('Error al cargar docentes:', error);
        return of([]);
      })
    );
  }

  findActive(): Observable<Docente[]> {
    return this.http.get<Docente[]>(`${this.nestJsUrl}/activos`).pipe(
      catchError(error => {
        console.warn('Endpoint de activos no disponible, usando findAll');
        return this.findAll();
      })
    );
  }

  findOne(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.nestJsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error al cargar docente ${id}:`, error);
        // Retornar un objeto Docente válido
        return of({
          id_docente: id,
          nombres: 'No disponible',
          apellidos: '',
          codigo_docente: `DOC-${id}`,
          estado: 'inactivo'
        } as Docente);
      })
    );
  }
}