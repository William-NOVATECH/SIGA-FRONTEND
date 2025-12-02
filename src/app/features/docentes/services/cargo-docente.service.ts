import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CargoDocente, CreateCargoDocenteDto, UpdateCargoDocenteDto } from '../models/cargo-docente.model';

@Injectable({
  providedIn: 'root'
})
export class CargoDocenteService {
  private nestJsUrl = `${environment.apiUrl}/cargos`;

  constructor(private http: HttpClient) {}

  create(createDto: CreateCargoDocenteDto): Observable<CargoDocente> {
    return this.http.post<CargoDocente>(this.nestJsUrl, createDto);
  }

  findAll(): Observable<CargoDocente[]> {
    return this.http.get<CargoDocente[]>(this.nestJsUrl);
  }

  findOne(id: number): Observable<CargoDocente> {
    return this.http.get<CargoDocente>(`${this.nestJsUrl}/${id}`);
  }

  update(id: number, updateDto: UpdateCargoDocenteDto): Observable<CargoDocente> {
    return this.http.put<CargoDocente>(`${this.nestJsUrl}/${id}`, updateDto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.nestJsUrl}/${id}`);
  }
}