import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Grupo, Carrera } from '../models/grupo-asignatura-docente.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private nestJsUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(this.nestJsUrl).pipe(
      map(grupos => grupos.map(grupo => this.ensureCarrera(grupo)))
    );
  }

  findOne(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.nestJsUrl}/${id}`).pipe(
      map(grupo => this.ensureCarrera(grupo))
    );
  }

  private ensureCarrera(grupo: Grupo): Grupo {
    // Si no hay carrera definida, crear una por defecto
    if (!grupo.carrera) {
      grupo.carrera = {
        id_carrera: 0,
        nombre_carrera: 'Carrera no especificada',
        codigo_carrera: 'N/A'
      };
    }
    return grupo;
  }
}