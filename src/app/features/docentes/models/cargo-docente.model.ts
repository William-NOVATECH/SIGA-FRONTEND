export interface CargoDocente {
  id_cargo: number;
  nombre_cargo: string;
  descripcion?: string;
  max_asignaturas: number;
  min_asignaturas?: number;
  estado?: string;
}

export interface CreateCargoDocenteDto {
  nombre_cargo: string;
  descripcion?: string;
  max_asignaturas: number;
  min_asignaturas?: number;
  estado?: string;
}

export interface UpdateCargoDocenteDto extends Partial<CreateCargoDocenteDto> {}