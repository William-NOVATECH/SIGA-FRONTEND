import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cargos-docente-page',
  templateUrl: './cargos-docente-page.component.html',
  styleUrls: ['./cargos-docente-page.component.css']
})
export class CargosDocentePageComponent {
  currentView: 'list' | 'form' = 'list';
  cargoId?: number;

  constructor(private router: Router) {}

  onBackToList(): void {
    this.currentView = 'list';
    this.cargoId = undefined;
  }

  onEditCargo(id: number): void {
    this.currentView = 'form';
    this.cargoId = id;
  }

  onNewCargo(): void {
    this.currentView = 'form';
    this.cargoId = undefined;
  }

  onBackToDocentes(): void {
    this.router.navigate(['/docentes']);
  }
}