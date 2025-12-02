import { RolResponse } from './usuario.interface';

export interface AsignarRol {
  id_rol: number;
  estado?: string;
}

export interface ActualizarRol {
  id_rol?: number;
  estado?: string;
}