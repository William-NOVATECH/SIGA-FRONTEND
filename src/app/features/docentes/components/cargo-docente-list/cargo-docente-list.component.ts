import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CargoDocenteService } from '../../services/cargo-docente.service';
import { CargoDocente } from '../../models/cargo-docente.model';

@Component({
  selector: 'app-cargo-docente-list',
  templateUrl: './cargo-docente-list.component.html',
  styleUrls: ['./cargo-docente-list.component.css']
})
export class CargoDocenteListComponent implements OnInit {
  @Output() edit = new EventEmitter<number>();  // Emite number

  cargos: CargoDocente[] = [];
  loading = false;
  error = '';

  constructor(private cargoDocenteService: CargoDocenteService) {}

  ngOnInit(): void {
    this.loadCargos();
  }

  loadCargos(): void {
  this.loading = true;
  this.cargoDocenteService.findAll().subscribe({
    next: (cargos) => {
      console.log('Cargos recibidos:', cargos);
      this.cargos = cargos;
      this.loading = false;
    },
    error: (err) => {
      console.error('Error cargando cargos:', err);
      this.error = 'Error al cargar los cargos docentes: ' + (err.error?.message || err.message);
      this.loading = false;
    }
  });
}

  onEdit(id: number): void {
    this.edit.emit(id);  // Emite el número directamente
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este cargo docente?')) {
      this.cargoDocenteService.remove(id).subscribe({
        next: () => {
          this.loadCargos();
        },
        error: (err) => {
          if (err.status === 400) {
            this.error = err.error?.message || 'No se puede eliminar el cargo porque hay docentes asignados';
          } else {
            this.error = 'Error al eliminar el cargo docente';
          }
          console.error('Error deleting cargo:', err);
        }
      });
    }
  }
}
