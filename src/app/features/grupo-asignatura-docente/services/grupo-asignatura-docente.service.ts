import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, switchMap, of, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  GrupoAsignaturaDocente,
  CreateGrupoAsignaturaDocente,
  CreateBulkGrupoAsignaturaDocente,
  QueryGrupoAsignaturaDocente,
  PaginatedResponse,
  BulkCreateResponse,
  GrupoConAsignaciones,
  Carrera,
  CargaDocenteVersion,
  ComparacionVersiones,
  CreateVersionInicialDto,
  EnviarRevisionDto,
  RevisarCargaDto,
  AprobarFinalDto,
  Grupo
} from '../models/grupo-asignatura-docente.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoAsignaturaDocenteService {
  private nestJsUrl = `${environment.apiUrl}/grupo-asignatura-docente`;

  constructor(private http: HttpClient) {}

  /**
   * Crear asignación (para administradores o cuando no se necesita versionamiento)
   * NOTA: Los coordinadores deben usar createVersionInicial() en su lugar
   */
  create(dto: CreateGrupoAsignaturaDocente): Observable<GrupoAsignaturaDocente> {
    return this.http.post<GrupoAsignaturaDocente>(this.nestJsUrl, dto);
  }

  createBulk(dto: CreateBulkGrupoAsignaturaDocente): Observable<BulkCreateResponse> {
    return this.http.post<BulkCreateResponse>(`${this.nestJsUrl}/bulk`, dto);
  }

  findAll(query?: QueryGrupoAsignaturaDocente): Observable<GrupoAsignaturaDocente[] | PaginatedResponse<GrupoAsignaturaDocente>> {
    let params = new HttpParams();
    
    if (query) {
      Object.keys(query).forEach(key => {
        const value = query[key as keyof QueryGrupoAsignaturaDocente];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<GrupoAsignaturaDocente[] | PaginatedResponse<GrupoAsignaturaDocente>>(this.nestJsUrl, { params });
  }

  findOne(id: number): Observable<GrupoAsignaturaDocente> {
    return this.http.get<GrupoAsignaturaDocente>(`${this.nestJsUrl}/${id}`).pipe(
      map(asignacion => this.ensureRelations(asignacion))
    );
  }

  findByGrupo(idGrupo: number): Observable<GrupoAsignaturaDocente[]> {
    return this.http.get<GrupoAsignaturaDocente[]>(`${this.nestJsUrl}/grupo/${idGrupo}`);
  }

  findByAsignatura(idAsignatura: number): Observable<GrupoAsignaturaDocente[]> {
    return this.http.get<GrupoAsignaturaDocente[]>(`${this.nestJsUrl}/asignatura/${idAsignatura}`);
  }

  findByDocente(idDocente: number): Observable<GrupoAsignaturaDocente[]> {
    return this.http.get<GrupoAsignaturaDocente[]>(`${this.nestJsUrl}/docente/${idDocente}`);
  }

  update(id: number, dto: Partial<CreateGrupoAsignaturaDocente>): Observable<GrupoAsignaturaDocente> {
    return this.http.patch<GrupoAsignaturaDocente>(`${this.nestJsUrl}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.nestJsUrl}/${id}`);
  }

  private ensureRelations(asignacion: GrupoAsignaturaDocente): GrupoAsignaturaDocente {
    // Asegurar que grupo siempre tenga carrera
    if (asignacion.grupo && !asignacion.grupo.carrera) {
      asignacion.grupo.carrera = {
        id_carrera: 0,
        nombre_carrera: 'Carrera no especificada',
        codigo_carrera: 'N/A'
      };
    }
    
    return asignacion;
  }
  // Método corregido para agrupar por grupo
getAsignacionesAgrupadas(): Observable<GrupoConAsignaciones[]> {
  return this.findAll().pipe(
    map(response => {
      const asignaciones = Array.isArray(response) ? response : response.data;
      console.log('Asignaciones crudas:', asignaciones); // Debug
      const gruposAgrupados = this.agruparPorGrupo(asignaciones);
      console.log('Grupos agrupados:', gruposAgrupados); // Debug
      return gruposAgrupados;
    })
  );
}

private agruparPorGrupo(asignaciones: GrupoAsignaturaDocente[]): GrupoConAsignaciones[] {
  const gruposMap = new Map<string, GrupoConAsignaciones>();

  asignaciones.forEach(asignacion => {
    // Crear una clave única usando múltiples propiedades del grupo
    const grupoKey = `${asignacion.id_grupo}-${asignacion.grupo?.codigo_grupo || 'sin-codigo'}`;

    if (!gruposMap.has(grupoKey)) {
      // Verificar que el grupo tenga la estructura correcta
      if (!asignacion.grupo) {
        console.error('Asignación sin información de grupo:', asignacion);
        return;
      }

      // Extraer la carrera del grupo (viene directamente del backend)
      const carreraDelGrupo = asignacion.grupo.carrera;
      console.log('Carrera del grupo:', carreraDelGrupo); // Debug
      
      gruposMap.set(grupoKey, {
        id_grupo: asignacion.id_grupo,
        codigo_grupo: asignacion.grupo.codigo_grupo,
        nombre_grupo: asignacion.grupo.nombre_grupo,
        carrera: this.ensureCarrera(carreraDelGrupo),
        asignaciones: []
      });
    }

    const grupo = gruposMap.get(grupoKey)!;
    
    // Verificar que la asignación tenga la estructura correcta
    if (asignacion.asignatura && asignacion.docente) {
      grupo.asignaciones.push({
        id_grupo_asignatura_docente: asignacion.id_grupo_asignatura_docente,
        asignatura: asignacion.asignatura,
        docente: asignacion.docente,
        fecha_asignacion: asignacion.fecha_asignacion,
        estado: asignacion.estado,
        observaciones: asignacion.observaciones,
        estado_aprobacion: asignacion.estado_aprobacion,
        version_actual: asignacion.version_actual
      });
    } else {
      console.warn('Asignación con estructura incompleta:', asignacion);
    }
  });

  const resultado = Array.from(gruposMap.values());
  console.log('Resultado final de agrupación:', resultado);
  return resultado;
}

private ensureCarrera(carrera: any): Carrera {
  // Si no hay carrera o no tiene nombre válido, devolver carrera por defecto
  if (!carrera || !carrera.nombre_carrera || 
      (typeof carrera.nombre_carrera === 'string' && carrera.nombre_carrera.trim() === '')) {
    return {
      id_carrera: 0,
      nombre_carrera: 'Carrera no especificada',
      codigo_carrera: 'N/A'
    };
  }
  
  // Preservar la carrera real que viene del backend
  const nombreCarrera = typeof carrera.nombre_carrera === 'string' 
    ? carrera.nombre_carrera.trim() 
    : String(carrera.nombre_carrera);
    
  return {
    id_carrera: carrera.id_carrera || 0,
    nombre_carrera: nombreCarrera,
    codigo_carrera: carrera.codigo_carrera || 'N/A'
  };
}

  // ========== ENDPOINTS DE VERSIONAMIENTO Y APROBACIÓN ==========

  /**
   * Crear versión inicial de carga docente
   * Rol: COORDINADOR
   */
  createVersionInicial(dto: CreateVersionInicialDto): Observable<GrupoAsignaturaDocente> {
    return this.http.post<GrupoAsignaturaDocente>(`${this.nestJsUrl}/version-inicial`, dto);
  }

  /**
   * Enviar carga docente a revisión
   * Rol: COORDINADOR (solo el que creó la versión)
   */
  enviarRevision(id: number, dto: EnviarRevisionDto): Observable<GrupoAsignaturaDocente> {
    return this.http.put<GrupoAsignaturaDocente>(`${this.nestJsUrl}/${id}/enviar-revision`, dto);
  }

  /**
   * Revisar carga docente (Director)
   * Rol: DIRECTORES
   */
  revisarCarga(id: number, dto: RevisarCargaDto): Observable<GrupoAsignaturaDocente> {
    return this.http.put<GrupoAsignaturaDocente>(`${this.nestJsUrl}/${id}/revisar`, dto);
  }

  /**
   * Aprobar carga docente final (Administrador)
   * Rol: ADMINISTRADOR
   */
  aprobarFinal(id: number, dto: AprobarFinalDto): Observable<GrupoAsignaturaDocente> {
    return this.http.put<GrupoAsignaturaDocente>(`${this.nestJsUrl}/${id}/aprobar-final`, dto);
  }

  /**
   * Obtener historial de versiones de una carga docente
   */
  getVersiones(id: number): Observable<CargaDocenteVersion[]> {
    return this.http.get<CargaDocenteVersion[]>(`${this.nestJsUrl}/${id}/versiones`);
  }

  /**
   * Comparar dos versiones
   */
  compareVersiones(id: number, v1: number, v2: number): Observable<ComparacionVersiones> {
    return this.http.get<ComparacionVersiones>(`${this.nestJsUrl}/${id}/versiones/${v1}/compare/${v2}`);
  }

  /**
   * Restaurar a una versión anterior
   * Rol: COORDINADOR o ADMINISTRADOR
   */
  restaurarVersion(id: number, versionId: number): Observable<GrupoAsignaturaDocente> {
    return this.http.post<GrupoAsignaturaDocente>(`${this.nestJsUrl}/${id}/restaurar-version/${versionId}`, {});
  }

  /**
   * Obtener grupos sin asignaciones de docentes
   * Si el endpoint no existe, obtiene todos los grupos y filtra los que no tienen asignaciones
   */
  getGruposSinAsignaciones(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.nestJsUrl}/grupos-sin-asignaciones`).pipe(
      map(grupos => grupos.map(grupo => this.ensureGrupoCarrera(grupo))),
      catchError((error) => {
        console.warn('Endpoint grupos-sin-asignaciones no disponible, filtrando localmente:', error);
        // Si el endpoint no existe, obtener todos los grupos y asignaciones y filtrar
        return forkJoin({
          asignaciones: this.findAll(),
          grupos: this.http.get<Grupo[]>(`${environment.apiUrl}/grupos`)
        }).pipe(
          map(({ asignaciones, grupos }) => {
            const asignacionesArray = Array.isArray(asignaciones) ? asignaciones : asignaciones.data;
            const gruposConAsignaciones = new Set(asignacionesArray.map((a: GrupoAsignaturaDocente) => a.id_grupo));
            const gruposSinAsignaciones = grupos.filter(grupo => !gruposConAsignaciones.has(grupo.id_grupo));
            return gruposSinAsignaciones.map(grupo => this.ensureGrupoCarrera(grupo));
          }),
          catchError(() => {
            console.error('Error al obtener grupos sin asignaciones');
            return of([]);
          })
        );
      })
    );
  }

  private ensureGrupoCarrera(grupo: any): Grupo {
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