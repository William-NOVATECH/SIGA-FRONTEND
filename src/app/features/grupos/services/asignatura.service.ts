import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Asignatura {
  id_asignatura: number;
  id_carrera: number;
  codigo_asignatura: string;    // Cambiado
  nombre_asignatura: string;    // Cambiado
  creditos: number;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private apiUrl = 'http://localhost:3000/asignaturas';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Asignatura[]> {
    return this.http.get<Asignatura[]>(this.apiUrl);
  }

  findOne(id: number): Observable<Asignatura> {
    return this.http.get<Asignatura>(`${this.apiUrl}/${id}`);
  }
}