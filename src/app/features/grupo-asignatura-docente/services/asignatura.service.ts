import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  codigo_asignatura?: string;
  creditos?: number;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private  nestJsUrl = `${environment.apiUrl}/asignaturas`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Asignatura[]> {
    return this.http.get<Asignatura[]>(this. nestJsUrl);
  }

  findOne(id: number): Observable<Asignatura> {
    return this.http.get<Asignatura>(`${this. nestJsUrl}/${id}`);
  }
}