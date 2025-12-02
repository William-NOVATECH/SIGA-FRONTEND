import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoService } from '../../services/grupo.service';
import { CarreraService } from '../../services/carrera.service';
import { Grupo, Carrera } from '../../models/grupo.model';

@Component({
  selector: 'app-grupo-detail',
  templateUrl: './grupo-detail.component.html',
  styleUrls: ['./grupo-detail.component.css']
})
export class GrupoDetailComponent implements OnInit {
  grupo?: Grupo;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoService: GrupoService,
    private carreraService: CarreraService
  ) {}

  ngOnInit(): void {
    this.loadGrupo();
  }

  loadGrupo(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading = true;
      this.grupoService.findOne(+id).subscribe({
        next: (grupo) => {
          this.grupo = grupo;
          
          // ✅ CORREGIDO: Verificar si la carrera ya viene en la respuesta
          if (!grupo.carrera && grupo.id_carrera) {
            this.loadCarrera(grupo.id_carrera);
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading grupo:', error);
          this.isLoading = false;
        }
      });
    }
  }

  loadCarrera(id: number): void {
    this.carreraService.findOne(id).subscribe({
      next: (carrera) => {
        if (this.grupo) {
          // ✅ CORREGIDO: Asignar directamente la carrera
          this.grupo.carrera = carrera;
        }
      },
      error: (error) => {
        console.error('Error loading carrera:', error);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/grupos', this.grupo?.id_grupo, 'edit']);
  }

  onBack(): void {
    this.router.navigate(['/grupos']);
  }

  getNombreCarrera(): string {
    if (this.grupo?.carrera) {
      return this.grupo.carrera.nombre_carrera;
    }
    return 'Sin carrera';
  }

  getInfoAsignaturas(): string {
    if (this.grupo?.min_asignaturas && this.grupo?.max_asignaturas) {
      return `${this.grupo.min_asignaturas} - ${this.grupo.max_asignaturas}`;
    } else if (this.grupo?.min_asignaturas) {
      return `Mín: ${this.grupo.min_asignaturas}`;
    } else if (this.grupo?.max_asignaturas) {
      return `Máx: ${this.grupo.max_asignaturas}`;
    }
    return 'No definido';
  }
}