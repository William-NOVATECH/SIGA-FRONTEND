import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AsignaturaService } from '../../services/asignatura.service';
import { Asignatura } from '../../models/asignatura.model';

@Component({
  selector: 'app-asignatura-detail',
  standalone: false,
  templateUrl: './asignatura-detail.component.html',
  styleUrls: ['./asignatura-detail.component.css']
})
export class AsignaturaDetailComponent implements OnInit {
  asignatura?: Asignatura;
  loading = false;
  errorMessage = '';

  constructor(
    private asignaturaService: AsignaturaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAsignatura();
  }

  loadAsignatura() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.asignaturaService.findOne(+id).subscribe({
        next: (asignatura: Asignatura) => {
          this.asignatura = asignatura;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading asignatura:', error);
          this.errorMessage = 'Error al cargar la asignatura';
          this.loading = false;
        }
      });
    }
  }

  editAsignatura() {
    if (this.asignatura) {
      this.router.navigate(['/asignaturas/editar', this.asignatura.id_asignatura]);
    }
  }

  goBack() {
    this.router.navigate(['/asignaturas']);
  }

  getEstadoClass(estado: string): string {
    return estado === 'activa' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getTipoClass(tipo: string): string {
    switch (tipo) {
      case 'obligatoria':
        return 'bg-blue-100 text-blue-800';
      case 'optativa':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}