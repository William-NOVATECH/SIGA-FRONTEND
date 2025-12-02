// features/asignaturas/services/asignatura.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, forkJoin } from 'rxjs';
import { 
  Asignatura, 
  CreateAsignatura, 
  UpdateAsignatura 
} from '../models/asignatura.model';
import { CarreraService, Carrera } from './carrera.service';

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private apiUrl = 'http://localhost:3000/asignaturas';

  constructor(
    private http: HttpClient,
    private carreraService: CarreraService
  ) {}

  // Crear asignatura
  create(asignatura: CreateAsignatura): Observable<Asignatura> {
    return this.http.post<Asignatura>(this.apiUrl, asignatura);
  }

  // Obtener todas las asignaturas CON información de carreras
  findAll(): Observable<Asignatura[]> {
    return forkJoin({
      asignaturas: this.http.get<Asignatura[]>(this.apiUrl),
      carreras: this.carreraService.findAllActive()
    }).pipe(
      map(({ asignaturas, carreras }) => {
        // Extraer el array de carreras de la respuesta
        const carrerasArray = Array.isArray(carreras.data) ? carreras.data : [carreras.data];
        
        return asignaturas.map(asignatura => {
          // Buscar la carrera correspondiente
          const carrera = carrerasArray.find((c: { id_carrera: number; }) => c.id_carrera === asignatura.id_carrera);
          
          return {
            ...asignatura,
            carrera: carrera ? {
              id_carrera: carrera.id_carrera,
              nombre_carrera: carrera.nombre_carrera,
              codigo_carrera: carrera.codigo_carrera
            } : undefined
          };
        });
      })
    );
  }

  // Obtener asignatura por ID
  findOne(id: number): Observable<Asignatura> {
    return forkJoin({
      asignatura: this.http.get<Asignatura>(`${this.apiUrl}/${id}`),
      carreras: this.carreraService.findAllActive()
    }).pipe(
      map(({ asignatura, carreras }) => {
        const carrerasArray = Array.isArray(carreras.data) ? carreras.data : [carreras.data];
        const carrera = carrerasArray.find((c: { id_carrera: number; }) => c.id_carrera === asignatura.id_carrera);
        
        return {
          ...asignatura,
          carrera: carrera ? {
            id_carrera: carrera.id_carrera,
            nombre_carrera: carrera.nombre_carrera,
            codigo_carrera: carrera.codigo_carrera
          } : undefined
        };
      })
    );
  }

  // Actualizar asignatura
  update(id: number, updateAsignatura: UpdateAsignatura): Observable<Asignatura> {
    return this.http.patch<Asignatura>(`${this.apiUrl}/${id}`, updateAsignatura);
  }

  // Eliminar asignatura
  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}