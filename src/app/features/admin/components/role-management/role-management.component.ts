import { Component, Inject, OnInit } from '@angular/core';
import { RolService } from '../../services/rol.service';
import { Rol } from '../../interfaces/rol.interface';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit {
  roles: Rol[] = [];
  loading: boolean = true;
  error: string = '';

    constructor(
    @Inject(RolService) private rolService: RolService // Agregar @Inject
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

    cargarRoles(): void {
    this.loading = true;
    this.rolService.getRoles().subscribe({
      next: (response: any) => {
        // Manejar tanto array simple como respuesta paginada
        if (Array.isArray(response)) {
          this.roles = response;
        } else if (response && response.data) {
          this.roles = response.data;
        } else {
          this.roles = [];
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Error al cargar los roles';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  getNivelAccesoTexto(nivel: number): string {
    switch (nivel) {
      case 1: return 'Básico';
      case 2: return 'Intermedio';
      case 3: return 'Alto';
      default: return 'Desconocido';
    }
  }

  getBadgeClass(nivel: number): string {
    switch (nivel) {
      case 1: return 'badge-basic';
      case 2: return 'badge-intermediate';
      case 3: return 'badge-high';
      default: return 'badge-unknown';
    }
  }
}