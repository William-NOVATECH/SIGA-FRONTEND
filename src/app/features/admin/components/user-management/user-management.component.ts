import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { RolService } from '../../services/rol.service';
import { Usuario, UsuarioRolResponse } from '../../interfaces/usuario.interface';
import { Rol } from '../../interfaces/rol.interface';
import { AsignarRol } from '../../interfaces/usuario-rol.interface';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { TableColumn, TableAction } from '../../../../core/components/data-table/data-table.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  loading: boolean = false;
  error: string = '';

  // Configuración de la tabla
  columns: TableColumn[] = [
    { field: 'id_usuario', header: 'ID', sortable: true, width: '80px' },
    { field: 'username', header: 'Usuario', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { 
      field: 'estado', 
      header: 'Estado', 
      sortable: true,
      template: 'badge',
      badgeClass: (value: string) => {
        return value === 'activo' ? 'status-active' : 'status-inactive';
      }
    },
    { 
      field: 'roles', 
      header: 'Rol', 
      sortable: false,
      template: 'badge',
      format: (value: UsuarioRolResponse[] | undefined, row?: Usuario) => {
        if (!value || value.length === 0) return 'Sin rol';
        // Solo mostrar el primer rol (debería ser el único)
        const primerRol = value[0];
        return primerRol.rol.nombre_rol;
      },
      badgeClass: (value: UsuarioRolResponse[] | undefined) => {
        if (!value || value.length === 0) return 'badge-no-roles';
        return 'badge-has-roles';
      }
    },
    { 
      field: 'fecha_creacion', 
      header: 'Fecha Creación', 
      sortable: true,
      format: (value: Date | string) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return date.toLocaleDateString('es-ES');
      }
    }
  ];

  actions: TableAction[] = [];

  // Modales
  showEditModal = false;
  showAssignRoleModal = false;
  usuarioSeleccionado?: Usuario;
  
  // Formularios
  editForm: any = {};
  assignRoleForm: any = {
    id_rol: '',
    estado: 'activo'
  };

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {
    this.setupActions();
  }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadRoles();
  }

  setupActions(): void {
    this.actions = [
      {
        label: 'Asignar Rol',
        icon: 'fa-user-plus',
        class: 'btn-action btn-assign',
        handler: (row: Usuario) => this.openAssignRoleModal(row),
        show: (row: Usuario) => true
      },
      {
        label: 'Editar',
        icon: 'fa-pencil',
        class: 'btn-action btn-edit',
        handler: (row: Usuario) => this.openEditModal(row),
        show: (row: Usuario) => true
      },
      {
        label: 'Activar',
        icon: 'fa-check-circle',
        class: 'btn-action btn-activate',
        handler: (row: Usuario) => this.activarUsuario(row),
        show: (row: Usuario) => row.estado === 'inactivo'
      },
      {
        label: 'Desactivar',
        icon: 'fa-pause-circle',
        class: 'btn-action btn-deactivate',
        handler: (row: Usuario) => this.desactivarUsuario(row),
        show: (row: Usuario) => row.estado === 'activo'
      },
      {
        label: 'Eliminar',
        icon: 'fa-trash',
        class: 'btn-action btn-delete',
        handler: (row: Usuario) => this.eliminarUsuario(row),
        show: (row: Usuario) => true
      }
    ];
  }

  loadUsuarios(): void {
    this.loading = true;
    this.error = '';

    // Intentar primero cargar usuarios con roles
    this.rolService.getUsuariosConRoles().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
      },
      error: (err) => {
        // Si falla, cargar usuarios básicos y luego roles
        console.warn('No se pudieron cargar usuarios con roles, cargando usuarios básicos:', err);
        this.usuarioService.getUsuarios().subscribe({
          next: (usuarios) => {
            // Cargar roles para cada usuario
            const loadRolesPromises = usuarios.map(usuario => {
              return new Promise<Usuario>((resolve) => {
                this.rolService.getRolesDeUsuario(usuario.id_usuario).subscribe({
                  next: (roles) => {
                    usuario.roles = roles || [];
                    resolve(usuario);
                  },
                  error: () => {
                    usuario.roles = [];
                    resolve(usuario);
                  }
                });
              });
            });

            Promise.all(loadRolesPromises).then(() => {
              this.usuarios = usuarios;
              this.loading = false;
            });
          },
          error: (err2) => {
            this.error = 'Error al cargar los usuarios';
            this.loading = false;
            this.toastService.showError('Error', 'No se pudieron cargar los usuarios.');
            console.error('Error loading usuarios:', err2);
          }
        });
      }
    });
  }

  loadRoles(): void {
    this.rolService.getRoles().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.roles = response;
        } else if (response?.data) {
          this.roles = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading roles:', err);
      }
    });
  }

  // Abrir modal de edición
  openEditModal(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.editForm = {
      username: usuario.username,
      email: usuario.email,
      estado: usuario.estado
    };
    this.showEditModal = true;
  }

  // Guardar cambios de edición
  saveEdit(): void {
    if (!this.usuarioSeleccionado) return;

    this.loading = true;
    this.usuarioService.updateUsuario(this.usuarioSeleccionado.id_usuario, this.editForm).subscribe({
      next: (usuario) => {
        const index = this.usuarios.findIndex(u => u.id_usuario === usuario.id_usuario);
        if (index !== -1) {
          this.usuarios[index] = { ...this.usuarios[index], ...usuario };
        }
        this.loading = false;
        this.showEditModal = false;
        this.toastService.showSuccess('Usuario actualizado', 'Los datos del usuario se han actualizado correctamente.');
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message || 'No se pudo actualizar el usuario.';
        this.toastService.showError('Error al actualizar', errorMessage);
      }
    });
  }

  // Abrir modal de asignar/cambiar rol
  openAssignRoleModal(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    
    // Si el usuario ya tiene un rol, pre-seleccionarlo
    const rolActual = usuario.roles && usuario.roles.length > 0 ? usuario.roles[0] : null;
    
    this.assignRoleForm = {
      id_rol: rolActual ? rolActual.rol.id_rol.toString() : '',
      estado: rolActual ? rolActual.estado : 'activo'
    };
    this.showAssignRoleModal = true;
  }

  // Asignar o cambiar rol a usuario (solo un rol por usuario)
  assignRole(): void {
    if (!this.usuarioSeleccionado || !this.assignRoleForm.id_rol) {
      this.toastService.showWarn('Selección requerida', 'Por favor selecciona un rol.');
      return;
    }

    const nuevoRolId = Number(this.assignRoleForm.id_rol);
    const tieneRol = this.usuarioSeleccionado.roles && this.usuarioSeleccionado.roles.length > 0;
    const rolActual = tieneRol ? this.usuarioSeleccionado.roles![0] : null;
    const esMismoRol = rolActual && rolActual.rol.id_rol === nuevoRolId;

    // Si es el mismo rol y solo cambia el estado, actualizar
    if (esMismoRol && rolActual) {
      if (rolActual.estado === this.assignRoleForm.estado) {
        this.toastService.showWarn('Sin cambios', 'El rol y estado son los mismos.');
        return;
      }
      
      // Solo actualizar el estado
      this.loading = true;
      this.rolService.actualizarRolUsuario(
        this.usuarioSeleccionado.id_usuario,
        rolActual.id_usuario_rol,
        { estado: this.assignRoleForm.estado }
      ).subscribe({
        next: () => {
          this.loading = false;
          this.showAssignRoleModal = false;
          this.toastService.showSuccess('Rol actualizado', 'El estado del rol se ha actualizado correctamente.');
          this.loadUsuarios();
        },
        error: (err) => {
          this.loading = false;
          const errorMessage = err.error?.message || err.message || 'No se pudo actualizar el rol.';
          this.toastService.showError('Error al actualizar', errorMessage);
        }
      });
      return;
    }

    // Si tiene un rol diferente, primero eliminar el anterior y luego asignar el nuevo
    this.loading = true;
    
    const eliminarRolAnterior = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!tieneRol || !rolActual) {
          resolve();
          return;
        }
        
        this.rolService.removerRolUsuario(
          this.usuarioSeleccionado!.id_usuario,
          rolActual.id_usuario_rol
        ).subscribe({
          next: () => resolve(),
          error: (err) => {
            console.error('Error eliminando rol anterior:', err);
            // Continuar de todas formas para intentar asignar el nuevo
            resolve();
          }
        });
      });
    };

    eliminarRolAnterior().then(() => {
      // Asignar el nuevo rol
      const asignacion: AsignarRol = {
        id_rol: nuevoRolId,
        estado: this.assignRoleForm.estado
      };

      this.rolService.asignarRol(this.usuarioSeleccionado!.id_usuario, asignacion).subscribe({
        next: () => {
          this.loading = false;
          this.showAssignRoleModal = false;
          const rolNombre = this.roles.find(r => r.id_rol === nuevoRolId)?.nombre_rol || 'rol';
          const mensaje = tieneRol 
            ? `El rol se ha cambiado a "${rolNombre}" correctamente.`
            : `El rol "${rolNombre}" se ha asignado correctamente.`;
          this.toastService.showSuccess(tieneRol ? 'Rol cambiado' : 'Rol asignado', mensaje);
          this.loadUsuarios(); // Recargar para ver los cambios
        },
        error: (err) => {
          this.loading = false;
          const errorMessage = err.error?.message || err.message || 'No se pudo asignar el rol.';
          this.toastService.showError('Error al asignar', errorMessage);
        }
      });
    });
  }

  // Activar usuario
  activarUsuario(usuario: Usuario): void {
    this.confirmService.confirm({
      message: `¿Estás seguro de que deseas activar al usuario "${usuario.username}"?`,
      header: 'Activar Usuario',
      icon: 'pi pi-check-circle',
      acceptCallback: () => {
        this.loading = true;
        this.usuarioService.activarUsuario(usuario.id_usuario).subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id_usuario === usuario.id_usuario);
            if (index !== -1) {
              this.usuarios[index].estado = 'activo';
            }
            this.loading = false;
            this.toastService.showSuccess('Usuario activado', `El usuario "${usuario.username}" ha sido activado.`);
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo activar el usuario.';
            this.toastService.showError('Error al activar', errorMessage);
          }
        });
      }
    });
  }

  // Desactivar usuario
  desactivarUsuario(usuario: Usuario): void {
    this.confirmService.confirm({
      message: `¿Estás seguro de que deseas desactivar al usuario "${usuario.username}"? El usuario no podrá acceder al sistema.`,
      header: 'Desactivar Usuario',
      icon: 'pi pi-pause-circle',
      acceptCallback: () => {
        this.loading = true;
        this.usuarioService.desactivarUsuario(usuario.id_usuario).subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id_usuario === usuario.id_usuario);
            if (index !== -1) {
              this.usuarios[index].estado = 'inactivo';
            }
            this.loading = false;
            this.toastService.showSuccess('Usuario desactivado', `El usuario "${usuario.username}" ha sido desactivado.`);
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo desactivar el usuario.';
            this.toastService.showError('Error al desactivar', errorMessage);
          }
        });
      }
    });
  }

  // Eliminar usuario
  eliminarUsuario(usuario: Usuario): void {
    this.confirmService.confirmDelete(
      () => {
        this.loading = true;
        this.usuarioService.deleteUsuario(usuario.id_usuario).subscribe({
          next: () => {
            this.usuarios = this.usuarios.filter(u => u.id_usuario !== usuario.id_usuario);
            this.loading = false;
            this.toastService.showSuccess('Usuario eliminado', `El usuario "${usuario.username}" ha sido eliminado.`);
          },
          error: (err) => {
            this.loading = false;
            const errorMessage = err.error?.message || err.message || 'No se pudo eliminar el usuario.';
            this.toastService.showError('Error al eliminar', errorMessage);
          }
        });
      },
      `¿Estás seguro de que deseas eliminar al usuario "${usuario.username}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación de usuario'
    );
  }

  // Obtener roles del usuario como string
  getRolesString(usuario: Usuario): string {
    if (!usuario.roles || usuario.roles.length === 0) {
      return 'Sin roles asignados';
    }
    return usuario.roles.map(r => r.rol.nombre_rol).join(', ');
  }

  // Verificar si usuario tiene roles
  hasRoles(usuario: Usuario): boolean {
    return !!(usuario.roles && usuario.roles.length > 0);
  }

  // Cerrar modales
  closeEditModal(): void {
    this.showEditModal = false;
    this.usuarioSeleccionado = undefined;
  }

  closeAssignRoleModal(): void {
    this.showAssignRoleModal = false;
    this.usuarioSeleccionado = undefined;
  }
}

