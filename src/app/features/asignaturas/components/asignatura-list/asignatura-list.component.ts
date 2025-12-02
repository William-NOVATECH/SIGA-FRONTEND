// features/asignaturas/components/asignatura-list/asignatura-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AsignaturaService } from '../../services/asignatura.service';
import { Asignatura } from '../../models/asignatura.model';

@Component({
  selector: 'app-asignatura-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asignatura-list.component.html',
  styleUrls: ['./asignatura-list.component.css'] 
})
export class AsignaturaListComponent implements OnInit {
  asignaturas: Asignatura[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private asignaturaService: AsignaturaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAsignaturas();
  }

  loadAsignaturas() {
    this.loading = true;
    this.errorMessage = '';
    
    this.asignaturaService.findAll().subscribe({
      next: (asignaturas) => {
        console.log('Respuesta del backend:', asignaturas); 
        this.asignaturas = asignaturas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading asignaturas:', error);
        this.errorMessage = 'Error al cargar las asignaturas';
        this.loading = false;
      }
    });
  }

  createAsignatura() {
    this.router.navigate(['/asignaturas/crear']);
  }

  editAsignatura(id: number) {
    this.router.navigate(['/asignaturas/editar', id]);
  }

  viewAsignatura(id: number) {
    this.router.navigate(['/asignaturas/detalle', id]);
  }

  deleteAsignatura(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta asignatura?')) {
      this.asignaturaService.remove(id).subscribe({
        next: () => {
          this.loadAsignaturas();
        },
        error: (error) => {
          console.error('Error deleting asignatura:', error);
          alert('Error al eliminar la asignatura');
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    return estado === 'activa' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getNombreCarrera(asignatura: Asignatura): string {
  if (!asignatura.carrera) return 'N/A';
  
  // Si la carrera es un objeto con nombre_carrera
  if (typeof asignatura.carrera === 'object' && asignatura.carrera.nombre_carrera) {
    return asignatura.carrera.nombre_carrera;
  }
  
  // Si es solo el ID o otra estructura
  return 'Carrera ' + asignatura.id_carrera;
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