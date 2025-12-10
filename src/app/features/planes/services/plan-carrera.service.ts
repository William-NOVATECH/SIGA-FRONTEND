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

  // Método para agregar una carrera a un plan (ahora solo se permite una carrera por plan)
  addCarrera(idPlan: number, idCarrera: number): Observable<PlanCarrera> {
    return this.http.post<PlanCarrera>(`${this.apiUrl}/${idPlan}/carreras`, { id_carrera: idCarrera });
  }

  // Método legacy - mantener por compatibilidad pero ahora solo acepta un elemento
  addCarreras(idPlan: number, carrerasIds: number[]): Observable<PlanCarrera> {
    // Solo tomar el primer ID ya que ahora solo se permite una carrera por plan
    const idCarrera = carrerasIds.length > 0 ? carrerasIds[0] : 0;
    if (idCarrera <= 0) {
      throw new Error('Debe proporcionar al menos un ID de carrera válido');
    }
    return this.addCarrera(idPlan, idCarrera);
  }
}

