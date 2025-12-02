// features/carreras/components/carrera-list/carrera-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarreraService } from '../../services/carrera.service';
import { Carrera, CarreraResponse } from '../../models/carrera.model';

@Component({
  selector: 'app-carrera-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrera-list.component.html',
  styleUrls: ['./carrera-list.component.css'] 
})
export class CarreraListComponent implements OnInit {
  carreras: Carrera[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private carreraService: CarreraService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCarreras();
  }

  loadCarreras() {
    this.loading = true;
    this.errorMessage = '';
    
    this.carreraService.findAll().subscribe({
      next: (response: CarreraResponse) => {
        this.carreras = Array.isArray(response.data) ? response.data : [response.data];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading carreras:', error);
        this.errorMessage = 'Error al cargar las carreras';
        this.loading = false;
      }
    });
  }

  createCarrera() {
    this.router.navigate(['/carreras/crear']);
  }

  editCarrera(id: number) {
    this.router.navigate(['/carreras/editar', id]);
  }

  viewCarrera(id: number) {
    this.router.navigate(['/carreras/detalle', id]);
  }

  deleteCarrera(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta carrera?')) {
      this.carreraService.remove(id).subscribe({
        next: () => {
          this.loadCarreras();
        },
        error: (error) => {
          console.error('Error deleting carrera:', error);
          alert('Error al eliminar la carrera');
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    return estado === 'activa' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }
}

