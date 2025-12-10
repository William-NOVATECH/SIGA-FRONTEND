export interface Plan {
  id_plan: number;
  nombre_plan: string;
  codigo_plan: string;
  año?: number;
  fecha_inicio?: Date | string;
  fecha_fin?: Date | string;
  descripcion?: string;
  estado?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
  carreras?: PlanCarreraResponse[];
}

export interface PlanCarreraResponse {
  id_plan_carrera: number;
  carrera: Carrera;
}

export interface PlanCarrera {
  id_plan_carrera: number;
  id_plan: number;
  id_carrera: number;
  plan?: Plan;
  carrera?: Carrera;
}

export interface PlanCarreraAsignatura {
  id_plan_carrera_asignatura: number;
  id_plan_carrera: number;
  id_asignatura: number;
  plan_carrera?: PlanCarrera;
  asignatura?: Asignatura;
}

export interface Carrera {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera?: string;
  id_departamento?: number;
}

export interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  codigo_asignatura?: string;
  id_carrera?: number;
}

// DTOs para crear
export interface CreatePlanDto {
  nombre_plan: string;
  codigo_plan: string;
  año?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  descripcion?: string;
  estado?: string;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface CreatePlanCarreraDto {
  id_plan: number;
  id_carrera: number;
}

export interface CreatePlanCarreraAsignaturaDto {
  id_plan_carrera: number;
  id_asignatura: number;
}

// Vista completa con relaciones
export interface PlanWithDetails extends Omit<Plan, 'carreras'> {
  carreras: PlanCarreraWithAsignaturas[];
}

export interface PlanCarreraWithAsignaturas extends PlanCarrera {
  asignaturas: PlanCarreraAsignatura[];
  carrera?: Carrera;
}

