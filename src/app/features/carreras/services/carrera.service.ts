import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Carrera, 
  CreateCarrera, 
  UpdateCarrera, 
  CarreraResponse 
} from '../models/carrera.model';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {
  private apiUrl = 'http://localhost:3000/carreras';

  constructor(private http: HttpClient) {}

  // Crear carrera
  create(carrera: CreateCarrera): Observable<CarreraResponse> {
    return this.http.post<CarreraResponse>(this.apiUrl, carrera);
  }

  // Obtener todas las carreras
  findAll(): Observable<CarreraResponse> {
    return this.http.get<CarreraResponse>(this.apiUrl);
  }

  // Obtener carrera por ID
  findOne(id: number): Observable<CarreraResponse> {
    return this.http.get<CarreraResponse>(`${this.apiUrl}/${id}`);
  }

  // Actualizar carrera
  update(id: number, updateCarrera: UpdateCarrera): Observable<CarreraResponse> {
    return this.http.put<CarreraResponse>(`${this.apiUrl}/${id}`, updateCarrera);
  }

  // Eliminar carrera
  remove(id: number): Observable<CarreraResponse> {
    return this.http.delete<CarreraResponse>(`${this.apiUrl}/${id}`);
  }
}