import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CarreraService } from '../../services/carrera.service';
import { Carrera } from '../../models/carrera.model';

@Component({
  selector: 'app-carrera-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrera-detail.component.html',
  styleUrls: ['./carrera-detail.component.css']
})
export class CarreraDetailComponent implements OnInit {
  carrera?: Carrera;
  loading = false;
  errorMessage = '';

  constructor(
    private carreraService: CarreraService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCarrera();
  }

  loadCarrera() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.carreraService.findOne(+id).subscribe({
        next: (response: any) => {
          this.carrera = response.data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading carrera:', error);
          this.errorMessage = 'Error al cargar la carrera';
          this.loading = false;
        }
      });
    }
  }

  editCarrera() {
    if (this.carrera) {
      this.router.navigate(['/carreras/editar', this.carrera.id_carrera]);
    }
  }

  goBack() {
    this.router.navigate(['/carreras']);
  }

  getEstadoClass(estado: string): string {
    return estado === 'activa' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }
}