import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Departamento, 
  CreateDepartamento, 
  UpdateDepartamento, 
  QueryDepartamento, 
  DepartamentoResponse 
} from '../models/departamento.model';

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private apiUrl = 'http://localhost:3000/departamentos';

  constructor(private http: HttpClient) {}

  // Crear departamento
  create(departamento: CreateDepartamento): Observable<Departamento> {
    return this.http.post<Departamento>(this.apiUrl, departamento);
  }

  // Obtener todos con filtros y paginación
  findAll(query?: QueryDepartamento): Observable<Departamento[] | DepartamentoResponse> {
    let params = new HttpParams();
    
    if (query) {
      Object.keys(query).forEach(key => {
        const value = query[key as keyof QueryDepartamento];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Departamento[] | DepartamentoResponse>(this.apiUrl, { params });
  }

  // Obtener por ID
  findOne(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/${id}`);
  }

  // Obtener por código
  findByCodigo(codigo: string): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/codigo/${codigo}`);
  }

  // Obtener por estado
  findByEstado(estado: string): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.apiUrl}/estado/${estado}`);
  }

  // Actualizar departamento
  update(id: number, updateDto: UpdateDepartamento): Observable<Departamento> {
    return this.http.patch<Departamento>(`${this.apiUrl}/${id}`, updateDto);
  }

  // Eliminar departamento
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}