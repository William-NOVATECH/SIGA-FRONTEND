import { Component, Input } from '@angular/core';
import { CargaDocenteWithRelations } from '../../models/carga-docente.model';

@Component({
  selector: 'app-carga-docente-details',
  templateUrl: './carga-docente-details.component.html',
  styleUrls: ['./carga-docente-details.component.css']
})
export class CargaDocenteDetailsComponent {
  @Input() carga!: CargaDocenteWithRelations;

  getEstadoBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'asignada': 'badge bg-primary',
      'finalizada': 'badge bg-success',
      'cancelada': 'badge bg-danger',
      'activo': 'badge bg-success',
      'inactivo': 'badge bg-danger'
    };
    return classes[estado] || 'badge bg-secondary';
  }

  getTipoVinculacionClass(tipo: string): string {
    const classes: { [key: string]: string } = {
      'titular': 'badge bg-info',
      'suplente': 'badge bg-warning',
      'auxiliar': 'badge bg-secondary',
      'coordinador': 'badge bg-dark'
    };
    return classes[tipo] || 'badge bg-light';
  }
}