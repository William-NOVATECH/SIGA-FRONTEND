import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  codigo_docente?: string;
  email?: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private  nestJsUrl = `${environment.apiUrl}/docentes`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Docente[]> {
  return this.http.get<Docente[]>(this.nestJsUrl).pipe(
    map((docentes: any[]) => docentes.map(docente => ({
      ...docente,
      nombre: `${docente.nombres} ${docente.apellidos}` // Propiedad para display
    }))),
    catchError(error => {
      console.error('Error al cargar docentes:', error);
      // Datos de ejemplo normalizados
      return of([
        { 
          id_docente: 1, 
          nombres: 'Mario', 
          apellidos: 'Pérez', 
          nombre: 'Mario Pérez',
          codigo_docente: 'DOC001', 
          estado: 'activo' 
        },
        { 
          id_docente: 2, 
          nombres: 'María', 
          apellidos: 'Gómez', 
          nombre: 'María Gómez',
          codigo_docente: 'DOC002', 
          estado: 'activo' 
        }
      ]);
    })
  );
}

  findOne(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this. nestJsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error al cargar docente ${id}:`, error);
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