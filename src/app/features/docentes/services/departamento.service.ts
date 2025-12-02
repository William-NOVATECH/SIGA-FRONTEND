import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Departamento {
  id_departamento: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private nestJsUrl = `${environment.apiUrl}/departamentos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.nestJsUrl);
  }

  findOne(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.nestJsUrl}/${id}`);
  }
}