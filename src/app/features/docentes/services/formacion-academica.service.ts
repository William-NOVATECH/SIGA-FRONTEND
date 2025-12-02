import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FormacionAcademica, CreateFormacionAcademicaDto, UpdateFormacionAcademicaDto } from '../models/formacion-academica.model';

@Injectable({
  providedIn: 'root'
})
export class FormacionAcademicaService {
  private nestJsUrl = `${environment.apiUrl}/docentes/formaciones`;

  constructor(private http: HttpClient) {}

  create(createFormacionDto: CreateFormacionAcademicaDto): Observable<FormacionAcademica> {
    return this.http.post<FormacionAcademica>(this.nestJsUrl, createFormacionDto);
  }

  findAll(idDocente?: number): Observable<FormacionAcademica[]> {
    let url = this.nestJsUrl;
    // Si se proporciona idDocente, enviarlo como query parameter sin el nombre 'idDocente'
    if (idDocente) {
      url += `?id_docente=${idDocente}`;
    }
    return this.http.get<FormacionAcademica[]>(url);
  }

  findOne(id: number): Observable<FormacionAcademica> {
    return this.http.get<FormacionAcademica>(`${this.nestJsUrl}/${id}`);
  }

  update(id: number, updateFormacionDto: UpdateFormacionAcademicaDto): Observable<FormacionAcademica> {
    return this.http.put<FormacionAcademica>(`${this.nestJsUrl}/${id}`, updateFormacionDto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.nestJsUrl}/${id}`);
  }
}