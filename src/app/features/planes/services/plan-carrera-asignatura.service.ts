import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PlanCarreraAsignatura,
  CreatePlanCarreraAsignaturaDto
} from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})
export class PlanCarreraAsignaturaService {
  private apiUrl = `${environment.apiUrl}/planes`;

  constructor(private http: HttpClient) {}

  create(idPlan: number, dto: CreatePlanCarreraAsignaturaDto): Observable<PlanCarreraAsignatura> {
    return this.http.post<PlanCarreraAsignatura>(
      `${this.apiUrl}/${idPlan}/carreras/${dto.id_plan_carrera}/asignaturas`,
      { id_asignatura: dto.id_asignatura }
    );
  }

  findByPlanCarrera(idPlan: number, idPlanCarrera: number): Observable<PlanCarreraAsignatura[]> {
    return this.http.get<PlanCarreraAsignatura[]>(
      `${this.apiUrl}/${idPlan}/carreras/${idPlanCarrera}/asignaturas`
    );
  }

  remove(idPlan: number, idPlanCarrera: number, idPlanCarreraAsignatura: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${idPlan}/carreras/${idPlanCarrera}/asignaturas/${idPlanCarreraAsignatura}`
    );
  }

  // Método para agregar múltiples asignaturas a un plan-carrera
  addAsignaturas(idPlan: number, idPlanCarrera: number, asignaturasIds: number[]): Observable<PlanCarreraAsignatura[]> {
    return this.http.post<PlanCarreraAsignatura[]>(
      `${this.apiUrl}/${idPlan}/carreras/${idPlanCarrera}/asignaturas`,
      { id_asignaturas: asignaturasIds }
    );
  }
}

