import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Carrera } from '../models/grupo.model';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {
  private apiUrl = 'http://localhost:3000/carreras';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Carrera[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // ✅ Manejar diferentes formatos de respuesta
        if (Array.isArray(response)) {
          return response as Carrera[];
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data as Carrera[];
        } else if (response && typeof response === 'object') {
          // Si es un objeto único, convertirlo a array
          return [response as Carrera];
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error('Error en carrera service:', error);
        return [];
      })
    );
  }

  findOne(id: number): Observable<Carrera> {
    return this.http.get<Carrera>(`${this.apiUrl}/${id}`);
  }
}