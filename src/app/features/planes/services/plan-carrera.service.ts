import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PlanCarrera,
  CreatePlanCarreraDto
} from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})
export class PlanCarreraService {
  private apiUrl = `${environment.apiUrl}/planes`;

  constructor(private http: HttpClient) {}

  create(dto: CreatePlanCarreraDto): Observable<PlanCarrera> {
    return this.http.post<PlanCarrera>(`${this.apiUrl}/${dto.id_plan}/carreras`, { id_carrera: dto.id_carrera });
  }

  findByPlan(idPlan: number): Observable<PlanCarrera[]> {
    return this.http.get<PlanCarrera[]>(`${this.apiUrl}/${idPlan}/carreras`);
  }

  remove(idPlan: number, idPlanCarrera: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idPlan}/carreras/${idPlanCarrera}`);
  }

  // Método para agregar múltiples carreras a un plan
  addCarreras(idPlan: number, carrerasIds: number[]): Observable<PlanCarrera[]> {
    return this.http.post<PlanCarrera[]>(`${this.apiUrl}/${idPlan}/carreras`, { id_carreras: carrerasIds });
  }
}

