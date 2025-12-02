import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Docente, 
  CreateDocenteDto, 
  UpdateDocenteDto,
  QueryDocenteDto,
  PaginatedResponse
} from '../models/docente.model';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private apiUrl = `${environment.apiUrl}/docentes`;

  constructor(private http: HttpClient) {}

  create(createDocenteDto: CreateDocenteDto): Observable<Docente> {
    return this.http.post<Docente>(this.apiUrl, createDocenteDto);
  }

  findAll(query?: QueryDocenteDto): Observable<Docente[] | PaginatedResponse<Docente>> {
    let params = new HttpParams();
    
    if (query) {
      Object.keys(query).forEach(key => {
        const value = (query as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Docente[] | PaginatedResponse<Docente>>(this.apiUrl, { params });
  }

  findByCodigo(codigo: string): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/codigo/${codigo}`);
  }

  findByEstado(estado: string): Observable<Docente[]> {
    return this.http.get<Docente[]>(`${this.apiUrl}/estado/${estado}`);
  }

  findOne(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/${id}`);
  }

  update(id: number, updateDocenteDto: UpdateDocenteDto): Observable<Docente> {
    return this.http.put<Docente>(`${this.apiUrl}/${id}`, updateDocenteDto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}