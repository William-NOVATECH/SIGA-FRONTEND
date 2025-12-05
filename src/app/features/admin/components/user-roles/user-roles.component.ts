import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService } from '../../services/rol.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario, UsuarioRolResponse } from '../../interfaces/usuario.interface';
import { Rol } from '../../interfaces/rol.interface';
import { AsignarRol, ActualizarRol } from '../../interfaces/usuario-rol.interface';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.css']
})
export class UserRolesComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  usuariosFiltrados: Usuario[] = [];
  asignacionForm: FormGroup;
  edicionRolForm: FormGroup; // Nuevo formulario para editar
  
  loading: boolean = true;
  buscando: boolean = false;
  error: string = '';
  terminoBusqueda: string = '';
  
  // Variables para edición de rol
  editandoRol: boolean = false;
  usuarioEditando?: Usuario;
  usuarioRolEditando?: UsuarioRolResponse;
  rolesDisponibles: Rol[] = [];

  constructor(
    private rolService: RolService,
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {
    this.asignacionForm = this.fb.group({
      id_usuario: ['', Validators.required],
      id_rol: ['', Validators.required],
      estado: ['activo']
    });

    // Nuevo formulario para editar rol asignado
    this.edicionRolForm = this.fb.group({
      nuevo_rol: ['', Validators.required],
      nuevo_estado: ['activo']
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.loading = true;
    this.error = '';

    // Cargar usuarios con roles
    this.rolService.getUsuariosConRoles().subscribe({
      next: (usuarios: Usuario[]) => {
        console.log('Usuarios con roles cargados:', usuarios);
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando usuarios con roles:', error);
        this.error = 'Error al cargar los usuarios con roles';
        this.toastService.showError('Error al cargar', 'No se pudieron cargar los usuarios con roles.');
        this.loading = false;
        this.cargarUsuariosBasicos();
      }
    });

    // Cargar roles
    this.cargarRoles();
  }

  cargarUsuariosBasicos(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios: Usuario[]) => {
        console.log('Usuarios básicos cargados:', usuarios);
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
      },
      error: (error: any) => {
        console.error('Error cargando usuarios básicos:', error);
        this.error += ' - También falló la carga de usuarios básicos';
        this.toastService.showError('Error al cargar', 'No se pudieron cargar los usuarios básicos.');
      }
    });
  }

  cargarRoles(): void {
    this.rolService.getRoles().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.roles = response;
        } else if (response && response.data) {
          this.roles = response.data;
        } else {
          this.roles = [];
        }
        console.log('Roles cargados:', this.roles);
      },
      error: (error: any) => {
        console.error('Error cargando roles:', error);
        this.error += ' - Error cargando roles';
        this.toastService.showError('Error al cargar', 'No se pudieron cargar los roles.');
      }
    });
  }

  buscarUsuarios(): void {
    if (!this.terminoBusqueda.trim()) {
      this.usuariosFiltrados = this.usuarios;
      this.toastService.showWarn('Búsqueda vacía', 'Por favor ingrese un término de búsqueda.');
      return;
    }

    this.buscando = true;
    const termino = this.terminoBusqueda.toLowerCase();
    
    // Búsqueda local por username o email
    const resultados = this.usuarios.filter(usuario => 
      usuario.username.toLowerCase().includes(termino) ||
      usuario.email.toLowerCase().includes(termino)
    );
    
    this.usuariosFiltrados = resultados;
    this.buscando = false;

    if (resultados.length === 0) {
      this.toastService.showInfo('Sin resultados', 'No se encontraron usuarios que coincidan con la búsqueda.');
    } else {
      this.toastService.showSuccess('Búsqueda completada', `Se encontraron ${resultados.length} usuario(s).`);
    }
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosFiltrados = this.usuarios;
    this.toastService.showInfo('Búsqueda limpiada', 'Se mostraron todos los usuarios.');
  }

  // ========== ASIGNAR NUEVO ROL ==========

  asignarRol(): void {
    if (this.asignacionForm.valid) {
      const formValue = this.asignacionForm.value;
      const asignacion: AsignarRol = {
        id_rol: formValue.id_rol,
        estado: formValue.estado
      };

      const usuarioSeleccionado = this.usuarios.find(u => u.id_usuario === formValue.id_usuario);
      const rolSeleccionado = this.roles.find(r => r.id_rol === formValue.id_rol);

      console.log('Asignando rol:', {
        usuarioId: formValue.id_usuario,
        asignacion: asignacion
      });
      
      this.rolService.asignarRol(formValue.id_usuario, asignacion).subscribe({
        next: (response: any) => {
          console.log('Rol asignado exitosamente:', response);
          
          // Recargar los datos para reflejar los cambios
          this.cargarDatosIniciales();
          this.asignacionForm.reset({ estado: 'activo' });
          
          const mensaje = `Rol "${rolSeleccionado?.nombre_rol || 'seleccionado'}" asignado correctamente al usuario "${usuarioSeleccionado?.username || 'seleccionado'}"`;
          this.toastService.showSuccess('Rol asignado', mensaje);
        },
        error: (error: any) => {
          console.error('Error asignando rol:', error);
          const mensajeError = error.error?.message || error.message || 'Error al asignar el rol';
          this.toastService.showError('Error al asignar rol', mensajeError);
        }
      });
    } else {
      this.toastService.showWarn('Formulario inválido', 'Por favor complete todos los campos requeridos.');
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.asignacionForm.controls).forEach(key => {
        this.asignacionForm.get(key)?.markAsTouched();
      });
    }
  }

  // ========== EDITAR ROL ASIGNADO ==========

  iniciarEdicionRol(usuario: Usuario, usuarioRol: UsuarioRolResponse): void {
    this.usuarioEditando = usuario;
    this.usuarioRolEditando = usuarioRol;
    this.editandoRol = true;
    
    // Filtrar roles disponibles (excluyendo el rol actual)
    this.rolesDisponibles = this.roles.filter(rol => 
      rol.id_rol !== usuarioRol.rol.id_rol
    );

    // Pre-cargar el formulario con los valores actuales
    this.edicionRolForm.patchValue({
      nuevo_rol: usuarioRol.rol.id_rol, // Rol actual
      nuevo_estado: usuarioRol.estado   // Estado actual
    });
  }

  cancelarEdicionRol(): void {
    this.editandoRol = false;
    this.usuarioEditando = undefined;
    this.usuarioRolEditando = undefined;
    this.edicionRolForm.reset({ nuevo_estado: 'activo' });
  }

  guardarCambiosRol(): void {
  if (this.edicionRolForm.valid && this.usuarioEditando && this.usuarioRolEditando) {
    const formValue = this.edicionRolForm.value;
    
    const datosActualizacion: ActualizarRol = {};
    
    // Solo actualizar rol si cambió
    const nuevoRolId = formValue.nuevo_rol;
    const rolCambio = nuevoRolId !== this.usuarioRolEditando.rol.id_rol;
    
    // Solo actualizar estado si cambió
    const nuevoEstado = formValue.nuevo_estado;
    const estadoCambio = nuevoEstado !== this.usuarioRolEditando.estado;
    
    if (rolCambio) {
      datosActualizacion.id_rol = nuevoRolId;
    }
    
    if (estadoCambio) {
      datosActualizacion.estado = nuevoEstado;
    }
    
    // Si no hay cambios, mostrar mensaje
    if (Object.keys(datosActualizacion).length === 0) {
      this.toastService.showWarn('Sin cambios', 'No se detectaron cambios para guardar.');
      return;
    }

    console.log('Actualizando rol:', {
      usuarioId: this.usuarioEditando.id_usuario,
      usuarioRolId: this.usuarioRolEditando.id_usuario_rol,
      datos: datosActualizacion
    });

    this.rolService.actualizarRolUsuario(
      this.usuarioEditando.id_usuario, 
      this.usuarioRolEditando.id_usuario_rol, 
      datosActualizacion
    ).subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);
        
        // ACTUALIZACIÓN MANUAL DE LOS DATOS LOCALES
        // =========================================
        
        // 1. Buscar el usuario en el array
        const usuarioIndex = this.usuarios.findIndex(
          u => u.id_usuario === this.usuarioEditando!.id_usuario
        );
        
        if (usuarioIndex !== -1 && this.usuarioEditando && this.usuarioRolEditando) {
          // 2. Buscar el rol específico dentro del usuario
          const usuario = this.usuarios[usuarioIndex];
          
          if (usuario.roles) {
            const rolIndex = usuario.roles.findIndex(
              r => r.id_usuario_rol === this.usuarioRolEditando!.id_usuario_rol
            );
            
            if (rolIndex !== -1) {
              // 3. Actualizar el rol localmente
              
              // Si cambió el rol
              if (rolCambio && datosActualizacion.id_rol) {
                const nuevoRol = this.roles.find(r => r.id_rol === datosActualizacion.id_rol);
                if (nuevoRol) {
                  usuario.roles[rolIndex].rol = {
                    id_rol: nuevoRol.id_rol,
                    nombre_rol: nuevoRol.nombre_rol,
                    descripcion: nuevoRol.descripcion,
                    nivel_acceso: nuevoRol.nivel_acceso
                  };
                }
              }
              
              // Si cambió el estado
              if (estadoCambio && datosActualizacion.estado) {
                usuario.roles[rolIndex].estado = datosActualizacion.estado;
              }
              
              console.log('Datos actualizados localmente:', usuario.roles[rolIndex]);
            }
          }
        }
        
        // 4. También actualizar el usuario filtrado
        this.actualizarUsuarioFiltrado();
        
        // 5. Cerrar el modal
        this.cancelarEdicionRol();
        
        // 6. Mostrar mensaje de éxito
        let mensaje = 'Cambios guardados correctamente.';
        if (rolCambio) {
          const nuevoRolNombre = this.roles.find(r => r.id_rol === nuevoRolId)?.nombre_rol || 'nuevo rol';
          mensaje += ` Rol cambiado a: ${nuevoRolNombre}.`;
        }
        if (estadoCambio) {
          mensaje += ` Estado cambiado a: ${nuevoEstado}.`;
        }
        this.toastService.showSuccess('Rol actualizado', mensaje);
      },
      error: (error: any) => {
        console.error('Error actualizando rol:', error);
        const mensajeError = error.error?.message || error.message || 'Error al actualizar el rol';
        this.toastService.showError('Error al actualizar', mensajeError);
      }
    });
  }
}

// Método para actualizar usuarios filtrados después de editar
private actualizarUsuarioFiltrado(): void {
  if (!this.usuarioEditando) return;
  
  // Actualizar en usuarios filtrados
  const filtradoIndex = this.usuariosFiltrados.findIndex(
    u => u.id_usuario === this.usuarioEditando!.id_usuario
  );
  
  if (filtradoIndex !== -1) {
    // Encontrar el usuario original actualizado
    const usuarioActualizado = this.usuarios.find(
      u => u.id_usuario === this.usuarioEditando!.id_usuario
    );
    
    if (usuarioActualizado) {
      // Reemplazar el usuario en la lista filtrada
      this.usuariosFiltrados[filtradoIndex] = { ...usuarioActualizado };
    }
  }
}

  // ========== CAMBIAR SOLO ESTADO ==========

  cambiarEstadoRol(usuario: Usuario, usuarioRol: UsuarioRolResponse, nuevoEstado: string): void {
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    const mensaje = `¿Estás seguro de que deseas ${accion} el rol "${usuarioRol.rol.nombre_rol}" del usuario "${usuario.username}"?`;

    this.confirmService.confirm({
      message: mensaje,
      header: 'Confirmar cambio de estado',
      icon: nuevoEstado === 'activo' ? 'pi pi-check-circle' : 'pi pi-pause-circle',
      acceptCallback: () => {
        console.log('Cambiando estado del rol:', {
          usuarioId: usuario.id_usuario,
          usuarioRolId: usuarioRol.id_usuario_rol,
          nuevoEstado: nuevoEstado
        });

        const datosActualizacion: ActualizarRol = {
          estado: nuevoEstado
        };

        this.rolService.actualizarRolUsuario(
          usuario.id_usuario, 
          usuarioRol.id_usuario_rol, 
          datosActualizacion
        ).subscribe({
          next: (response: any) => {
            console.log('Estado actualizado:', response);
            // Actualizar el estado localmente
            usuarioRol.estado = nuevoEstado;
            this.toastService.showSuccess('Estado actualizado', `El rol se ha ${accion}do correctamente.`);
          },
          error: (error: any) => {
            console.error('Error actualizando estado:', error);
            const mensajeError = error.error?.message || error.message || 'Error al actualizar el estado del rol';
            this.toastService.showError('Error al actualizar', mensajeError);
          }
        });
      }
    });
  }

  // ========== REMOVER ROL ==========

  removerRol(usuario: Usuario, usuarioRol: UsuarioRolResponse): void {
    const rolNombre = usuarioRol.rol.nombre_rol;
    const usuarioNombre = usuario.username;
    
    this.confirmService.confirmDelete(
      () => {
        console.log('Removiendo rol:', {
          usuarioId: usuario.id_usuario,
          usuarioRolId: usuarioRol.id_usuario_rol
        });
        
        this.rolService.removerRolUsuario(usuario.id_usuario, usuarioRol.id_usuario_rol).subscribe({
          next: () => {
            console.log('Rol removido exitosamente');
            
            // Remover localmente del array de roles
            if (usuario.roles) {
              usuario.roles = usuario.roles.filter(r => r.id_usuario_rol !== usuarioRol.id_usuario_rol);
            }
            
            // Actualizar usuarios filtrados
            const usuarioFiltrado = this.usuariosFiltrados.find(u => u.id_usuario === usuario.id_usuario);
            if (usuarioFiltrado && usuarioFiltrado.roles) {
              usuarioFiltrado.roles = usuarioFiltrado.roles.filter(r => r.id_usuario_rol !== usuarioRol.id_usuario_rol);
            }
            
            this.toastService.showSuccess('Rol removido', `El rol "${rolNombre}" ha sido removido del usuario "${usuarioNombre}".`);
          },
          error: (error: any) => {
            console.error('Error removiendo rol:', error);
            const mensajeError = error.error?.message || error.message || 'Error al remover el rol';
            this.toastService.showError('Error al remover', mensajeError);
          }
        });
      },
      `¿Estás seguro de que deseas remover el rol "${rolNombre}" del usuario "${usuarioNombre}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación de rol'
    );
  }

  // ========== UTILIDADES ==========

  getRolesUsuario(usuario: Usuario): UsuarioRolResponse[] {
    return usuario.roles || [];
  }

  getBadgeClass(estado: string): string {
    return estado === 'activo' ? 'bg-success' : 'bg-secondary';
  }

  getUsuarioDisplay(usuario: Usuario): string {
    return `${usuario.username} (${usuario.email})`;
  }

  getTotalRolesAsignados(): number {
  return this.usuarios.reduce((total, usuario) => {
    return total + (usuario.roles ? usuario.roles.length : 0);
  }, 0);
}

  // Obtener nombre del rol por ID
  getNombreRol(idRol: number): string {
    const rol = this.roles.find(r => r.id_rol === idRol);
    return rol ? rol.nombre_rol : 'Rol no encontrado';
  }
}