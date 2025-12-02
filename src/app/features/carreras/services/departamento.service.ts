import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
  codigo_departamento: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private apiUrl = 'http://localhost:3000/departamentos';

  constructor(private http: HttpClient) {}

  // Obtener todos los departamentos activos
  findAllActive(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.apiUrl}/estado/activo`);
  }
}