import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AsignaturaService } from '../../services/asignatura.service';
import { CarreraService, Carrera } from '../../services/carrera.service';
import { CreateAsignatura, UpdateAsignatura, Asignatura } from '../../models/asignatura.model';

@Component({
  selector: 'app-asignatura-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asignatura-form.component.html',
  styleUrls: ['./asignatura-form.component.css']
})
export class AsignaturaFormComponent implements OnInit {
  asignaturaForm: FormGroup;
  isEdit = false;
  loading = false;
  loadingCarreras = false;
  asignaturaId?: number;
  carreras: Carrera[] = [];
  errorMessage = '';

  // Opciones para selects
  tiposAsignatura = [
    { value: 'obligatoria', label: 'Obligatoria' },
    { value: 'optativa', label: 'Optativa' },
    { value: 'electiva', label: 'Electiva' }
  ];

  estados = [
    { value: 'activa', label: 'Activa' },
    { value: 'inactiva', label: 'Inactiva' }
  ];

  semestres = Array.from({ length: 12 }, (_, i) => i + 1);

  constructor(
    private fb: FormBuilder,
    private asignaturaService: AsignaturaService,
    private carreraService: CarreraService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.asignaturaForm = this.fb.group({
      id_carrera: ['', Validators.required],
      codigo_asignatura: ['', [Validators.required, Validators.maxLength(20)]],
      nombre_asignatura: ['', [Validators.required, Validators.maxLength(200)]],
      creditos: ['', [Validators.required, Validators.min(1), Validators.max(10)]],
      horas_semanales: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
      semestre: [''],
      tipo: ['obligatoria'],
      estado: ['activa'],
      prerequisitos: ['']
    });
  }

  ngOnInit() {
    this.loadCarreras();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.asignaturaId = +params['id'];
        this.loadAsignatura();
      }
    });
  }

  loadCarreras() {
    this.loadingCarreras = true;
    this.carreraService.findAllActive().subscribe({
      next: (response: any) => {
        // Extraer el array de carreras de la respuesta
        this.carreras = Array.isArray(response.data) ? response.data : [response.data];
        this.loadingCarreras = false;
      },
      error: (error) => {
        console.error('Error loading carreras:', error);
        this.errorMessage = 'Error al cargar las carreras';
        this.loadingCarreras = false;
      }
    });
  }

  loadAsignatura() {
    if (this.asignaturaId) {
      this.loading = true;
      this.asignaturaService.findOne(this.asignaturaId).subscribe({
        next: (asignatura: Asignatura) => {
          this.asignaturaForm.patchValue({
            id_carrera: asignatura.id_carrera,
            codigo_asignatura: asignatura.codigo_asignatura,
            nombre_asignatura: asignatura.nombre_asignatura,
            creditos: asignatura.creditos,
            horas_semanales: asignatura.horas_semanales,
            semestre: asignatura.semestre || '',
            tipo: asignatura.tipo,
            estado: asignatura.estado,
            prerequisitos: asignatura.prerequisitos || ''
          });
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

  onSubmit() {
    if (this.asignaturaForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = this.asignaturaForm.value;
      
      // Convertir campos numéricos
      const processedData = {
        ...formValue,
        id_carrera: Number(formValue.id_carrera),
        creditos: Number(formValue.creditos),
        horas_semanales: Number(formValue.horas_semanales),
        semestre: formValue.semestre ? Number(formValue.semestre) : undefined,
        prerequisitos: formValue.prerequisitos || undefined
      };

      if (this.isEdit && this.asignaturaId) {
        const updateData: UpdateAsignatura = { ...processedData };
        this.asignaturaService.update(this.asignaturaId, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/asignaturas']);
          },
          error: (error) => {
            console.error('Error updating asignatura:', error);
            this.errorMessage = error.error?.message || 'Error al actualizar la asignatura';
            this.loading = false;
          }
        });
      } else {
        const createData: CreateAsignatura = { ...processedData };
        this.asignaturaService.create(createData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/asignaturas']);
          },
          error: (error) => {
            console.error('Error creating asignatura:', error);
            this.errorMessage = error.error?.message || 'Error al crear la asignatura';
            this.loading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/asignaturas']);
  }

  private markFormGroupTouched() {
    Object.keys(this.asignaturaForm.controls).forEach(key => {
      const control = this.asignaturaForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación
  get id_carrera() {
    return this.asignaturaForm.get('id_carrera');
  }

  get codigo_asignatura() {
    return this.asignaturaForm.get('codigo_asignatura');
  }

  get nombre_asignatura() {
    return this.asignaturaForm.get('nombre_asignatura');
  }

  get creditos() {
    return this.asignaturaForm.get('creditos');
  }

  get horas_semanales() {
    return this.asignaturaForm.get('horas_semanales');
  }
}