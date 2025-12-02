import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { 
  CargaDocente, 
  CargaDocenteWithRelations 
} from '../models/carga-docente.model';
import { 
  CreateCargaDocente, 
  UpdateCargaDocente 
} from '../interfaces/create-carga-docente.interface';
import { 
  QueryCargaDocente, 
  CargaDocenteResponse 
} from '../interfaces/query-carga-docente.interface';
import { 
  VerificationResponse 
} from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CargaDocenteService {
  private nestJsUrl = `${environment.apiUrl}/carga-docente`;

  constructor(private http: HttpClient) {}

  // CRUD Operations
  create(carga: CreateCargaDocente): Observable<CargaDocente> {
    return this.http.post<CargaDocente>(this.nestJsUrl, carga);
  }

  findAll(query?: QueryCargaDocente): Observable<CargaDocenteResponse> {
    let params = new HttpParams();
    
    // QUITAMOS el parámetro include que causa el error 400
    // params = params.set('include', 'docente,grupo,grupo.asignatura');
    
    if (query) {
      Object.keys(query).forEach(key => {
        const value = (query as any)[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<CargaDocenteResponse>(this.nestJsUrl, { params });
  }

  findOne(id: number): Observable<CargaDocenteWithRelations> {
    // QUITAMOS el parámetro include
    // let params = new HttpParams();
    // params = params.set('include', 'docente,grupo,grupo.asignatura');
    
    return this.http.get<CargaDocenteWithRelations>(`${this.nestJsUrl}/${id}`);
  }

  update(id: number, carga: UpdateCargaDocente): Observable<CargaDocente> {
    return this.http.put<CargaDocente>(`${this.nestJsUrl}/${id}`, carga);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.nestJsUrl}/${id}`);
  }

  // Specialized Endpoints
  getCargasByDocente(idDocente: number): Observable<CargaDocenteWithRelations[]> {
    return this.http.get<CargaDocenteWithRelations[]>(
      `${this.nestJsUrl}/docente/${idDocente}`
    );
  }

  getDocentesByGrupo(idGrupo: number): Observable<CargaDocenteWithRelations[]> {
    return this.http.get<CargaDocenteWithRelations[]>(
      `${this.nestJsUrl}/grupo/${idGrupo}`
    );
  }

  getCargasActivasByDocente(idDocente: number): Observable<CargaDocenteWithRelations[]> {
    return this.http.get<CargaDocenteWithRelations[]>(
      `${this.nestJsUrl}/docente/${idDocente}/activas`
    );
  }

  countCargasActivasByDocente(idDocente: number): Observable<number> {
    return this.http.get<number>(
      `${this.nestJsUrl}/docente/${idDocente}/count-activas`
    );
  }

  canAssignDocenteToGrupo(idDocente: number, idGrupo: number): Observable<VerificationResponse> {
    return this.http.get<VerificationResponse>(
      `${this.nestJsUrl}/verificar-asignacion/${idDocente}/${idGrupo}`
    );
  }

  finalizarCargasByPeriodo(periodo: string): Observable<any> {
    return this.http.put(
      `${this.nestJsUrl}/finalizar-periodo/${periodo}`, 
      {}
    );
  }

  // Agrega estos métodos al servicio:

/**
 * Carga las relaciones (docente y grupo) para una carga docente
 */
loadRelationsForCarga(carga: CargaDocente): Observable<CargaDocenteWithRelations> {
  return new Observable(observer => {
    const cargaWithRelations: CargaDocenteWithRelations = { ...carga };

    // Cargar docente
    this.loadDocente(carga.id_docente).subscribe(docente => {
      cargaWithRelations.docente = docente;

      // Cargar grupo
      this.loadGrupo(carga.id_grupo).subscribe(grupo => {
        cargaWithRelations.grupo = grupo;
        observer.next(cargaWithRelations);
        observer.complete();
      });
    });
  });
}

/**
 * Carga las relaciones para múltiples cargas docentes
 */
loadRelationsForCargas(cargas: CargaDocente[]): Observable<CargaDocenteWithRelations[]> {
  return new Observable(observer => {
    if (cargas.length === 0) {
      observer.next([]);
      observer.complete();
      return;
    }

    const cargasWithRelations: CargaDocenteWithRelations[] = [];
    let completed = 0;

    cargas.forEach(carga => {
      this.loadRelationsForCarga(carga).subscribe(cargaWithRelations => {
        cargasWithRelations.push(cargaWithRelations);
        completed++;

        if (completed === cargas.length) {
          observer.next(cargasWithRelations);
          observer.complete();
        }
      });
    });
  });
}

/**
 * Método auxiliar para cargar un docente
 */
private loadDocente(idDocente: number): Observable<any> {
  // Asumiendo que tienes un endpoint para obtener un docente por ID
  return this.http.get(`${environment.apiUrl}/docentes/${idDocente}`);
}

/**
 * Método auxiliar para cargar un grupo
 */
private loadGrupo(idGrupo: number): Observable<any> {
  // Asumiendo que tienes un endpoint para obtener un grupo por ID
  return this.http.get(`${environment.apiUrl}/grupos/${idGrupo}`);
}
}