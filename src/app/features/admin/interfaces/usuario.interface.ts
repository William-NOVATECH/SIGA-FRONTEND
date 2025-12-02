export interface RolResponse {
  id_rol: number;
  nombre_rol: string;
  descripcion?: string;
  nivel_acceso: number;
}

export interface UsuarioRolResponse {
  id_usuario_rol: number;
  estado: string;
  rol: RolResponse;
}

export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
  estado: string;
  fecha_creacion: Date;
  fecha_ultimo_acceso?: Date;
  roles?: UsuarioRolResponse[]; // Cambié de usuarioRoles a roles para coincidir con tu DTO
}

export interface CreateUsuario {
  username: string;
  email: string;
  password: string;
  estado?: string;
}