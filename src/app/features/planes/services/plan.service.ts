import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Plan,
  CreatePlanDto,
  UpdatePlanDto,
  PlanWithDetails
} from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiUrl}/planes`;

  constructor(private http: HttpClient) {}

  create(dto: CreatePlanDto): Observable<Plan> {
    return this.http.post<Plan>(this.apiUrl, dto);
  }

  findAll(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.apiUrl);
  }

  findOne(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.apiUrl}/${id}`);
  }

  findOneWithDetails(id: number): Observable<PlanWithDetails> {
    return this.http.get<PlanWithDetails>(`${this.apiUrl}/${id}/details`);
  }

  update(id: number, dto: UpdatePlanDto): Observable<Plan> {
    return this.http.patch<Plan>(`${this.apiUrl}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

