import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private apiUrl = 'http://localhost:3000/docentes';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Docente[]> {
    return this.http.get<Docente[]>(this.apiUrl);
  }

  findOne(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/${id}`);
  }
}