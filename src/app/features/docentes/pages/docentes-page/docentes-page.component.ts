import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-docentes-page',
  templateUrl: './docentes-page.component.html',
    styleUrls: ['./docentes-page.component.css']

})
export class DocentesPageComponent implements OnInit {
  currentView: 'list' | 'form' | 'detail' = 'list';
  docenteId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.docenteId = +params['id'];
        if (this.router.url.includes('editar')) {
          this.currentView = 'form';
        } else if (this.router.url.includes('detalle')) {
          this.currentView = 'detail';
        }
      } else if (this.router.url.includes('nuevo')) {
        this.currentView = 'form';
      } else {
        this.currentView = 'list';
      }
    });
  }

  onBackToList(): void {
    this.currentView = 'list';
    this.docenteId = undefined;
    this.router.navigate(['/docentes']);
  }

  onEditDocente(id: number): void {
    this.currentView = 'form';
    this.docenteId = id;
    this.router.navigate(['/docentes/editar', id]);
  }

  onViewDetail(id: number): void {
    this.currentView = 'detail';
    this.docenteId = id;
    this.router.navigate(['/docentes/detalle', id]);
  }

  onNewDocente(): void {
    this.currentView = 'form';
    this.docenteId = undefined;
    this.router.navigate(['/docentes/nuevo']);
  }
}