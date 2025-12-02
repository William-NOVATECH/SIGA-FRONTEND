import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Carrera {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarreraService {
  private apiUrl = 'http://localhost:3000/carreras';

  constructor(private http: HttpClient) {}

  // Obtener todas las carreras activas
  findAllActive(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}