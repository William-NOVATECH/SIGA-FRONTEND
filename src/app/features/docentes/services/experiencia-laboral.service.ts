import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExperienciaLaboral, CreateExperienciaLaboralDto, UpdateExperienciaLaboralDto } from '../models/experiencia-laboral.model';

@Injectable({
  providedIn: 'root'
})
export class ExperienciaLaboralService {
  private nestJsUrl = `${environment.apiUrl}/docentes/experiencias`;

  constructor(private http: HttpClient) {}

  create(createExperienciaDto: CreateExperienciaLaboralDto): Observable<ExperienciaLaboral> {
    return this.http.post<ExperienciaLaboral>(this.nestJsUrl, createExperienciaDto);
  }

  findAll(idDocente?: number): Observable<ExperienciaLaboral[]> {
    let url = this.nestJsUrl;
    // Si se proporciona idDocente, enviarlo como query parameter sin el nombre 'idDocente'
    if (idDocente) {
      url += `?id_docente=${idDocente}`;
    }
    return this.http.get<ExperienciaLaboral[]>(url);
  }

  findOne(id: number): Observable<ExperienciaLaboral> {
    return this.http.get<ExperienciaLaboral>(`${this.nestJsUrl}/${id}`);
  }

  update(id: number, updateExperienciaDto: UpdateExperienciaLaboralDto): Observable<ExperienciaLaboral> {
    return this.http.put<ExperienciaLaboral>(`${this.nestJsUrl}/${id}`, updateExperienciaDto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.nestJsUrl}/${id}`);
  }
}