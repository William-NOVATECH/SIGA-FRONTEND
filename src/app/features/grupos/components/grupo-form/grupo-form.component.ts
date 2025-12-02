import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoService } from '../../services/grupo.service';
import { CarreraService } from '../../services/carrera.service';
// ❌ ELIMINADO: import { DocenteService, Docente } from '../../services/docente.service';
import { Carrera, CreateGrupoDto, UpdateGrupoDto } from '../../models/grupo.model';

@Component({
  selector: 'app-grupo-form',
  templateUrl: './grupo-form.component.html',
  styleUrls: ['./grupo-form.component.css']
})
export class GrupoFormComponent implements OnInit {
  grupoForm: FormGroup;
  isEditMode = false;
  grupoId?: number;
  isLoading = false;
  
  carreras: Carrera[] = [];
  // ❌ ELIMINADO: docentes: Docente[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private grupoService: GrupoService,
    private carreraService: CarreraService,
    // ❌ ELIMINADO: private docenteService: DocenteService
  ) {
    this.grupoForm = this.createForm();
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadCarreras()
      // ❌ ELIMINADO: this.loadDocentes()
    ]);

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.grupoId = +params['id'];
        this.loadGrupo(this.grupoId);
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      id_carrera: ['', Validators.required],
      codigo_grupo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre_grupo: ['', Validators.maxLength(100)],
      periodo_academico: ['', [Validators.required, Validators.maxLength(20)]],
      // ❌ ELIMINADO: id_docente_titular: [''],
      min_asignaturas: [''],
      max_asignaturas: [''],
      estado: ['activo']
    });
  }

  loadGrupo(id: number): void {
    this.isLoading = true;
    this.grupoService.findOne(id).subscribe({
      next: (grupo) => {
        this.grupoForm.patchValue({
          id_carrera: grupo.id_carrera,
          codigo_grupo: grupo.codigo_grupo,
          nombre_grupo: grupo.nombre_grupo,
          periodo_academico: grupo.periodo_academico,
          // ❌ ELIMINADO: id_docente_titular: grupo.id_docente_titular || '',
          min_asignaturas: grupo.min_asignaturas || '',
          max_asignaturas: grupo.max_asignaturas || '',
          estado: grupo.estado
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading grupo:', error);
        this.isLoading = false;
      }
    });
  }

  async loadCarreras(): Promise<void> {
    return new Promise((resolve) => {
      this.carreraService.findAll().subscribe({
        next: (carreras) => {
          this.carreras = carreras;
          resolve();
        },
        error: (error) => {
          console.error('Error cargando carreras:', error);
          this.carreras = [];
          resolve();
        }
      });
    });
  }

  // ❌ ELIMINADO: loadDocentes()

  onSubmit(): void {
    if (this.grupoForm.valid) {
      this.isLoading = true;
      const formValue = this.grupoForm.value;

      // Convertir min/max asignaturas a número o null
      const processedValue = {
        ...formValue,
        // ❌ ELIMINADO: id_docente_titular: formValue.id_docente_titular || null,
        min_asignaturas: formValue.min_asignaturas ? +formValue.min_asignaturas : null,
        max_asignaturas: formValue.max_asignaturas ? +formValue.max_asignaturas : null
      };

      if (this.isEditMode && this.grupoId) {
        const updateDto: UpdateGrupoDto = processedValue;

        this.grupoService.update(this.grupoId, updateDto).subscribe({
          next: () => {
            this.router.navigate(['/grupos']);
          },
          error: (error) => {
            console.error('Error updating grupo:', error);
            this.isLoading = false;
          }
        });
      } else {
        const createDto: CreateGrupoDto = processedValue;

        this.grupoService.create(createDto).subscribe({
          next: () => {
            this.router.navigate(['/grupos']);
          },
          error: (error) => {
            console.error('Error creating grupo:', error);
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.grupoForm.controls).forEach(key => {
      const control = this.grupoForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/grupos']);
  }

  get hasCarreras(): boolean {
    return this.carreras.length > 0;
  }

  // ❌ ELIMINADO: get hasDocentes()
}