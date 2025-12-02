// features/carreras/components/carrera-form/carrera-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarreraService } from '../../services/carrera.service';
import { DepartamentoService, Departamento } from '../../services/departamento.service';
import { CreateCarrera, UpdateCarrera, Carrera } from '../../models/carrera.model';

@Component({
  selector: 'app-carrera-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './carrera-form.component.html',
  styleUrls: ['./carrera-form.component.css']
})
export class CarreraFormComponent implements OnInit {
  carreraForm: FormGroup;
  isEdit = false;
  loading = false;
  loadingDepartamentos = false;
  carreraId?: number;
  departamentos: Departamento[] = [];
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private carreraService: CarreraService,
    private departamentoService: DepartamentoService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.carreraForm = this.fb.group({
      nombre_carrera: ['', [Validators.required, Validators.maxLength(200)]],
      codigo_carrera: ['', [Validators.required, Validators.maxLength(20)]],
      duracion_semestres: ['null'],
      titulo_otorga: ['', [Validators.maxLength(100)]],
      estado: ['activa'],
      id_departamento: ['null', Validators.required]
    });
  }

  ngOnInit() {
    this.loadDepartamentos();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.carreraId = +params['id'];
        this.loadCarrera();
      }
    });
  }

  loadDepartamentos() {
    this.loadingDepartamentos = true;
    this.departamentoService.findAllActive().subscribe({
      next: (departamentos) => {
        this.departamentos = departamentos;
        this.loadingDepartamentos = false;
      },
      error: (error) => {
        console.error('Error loading departamentos:', error);
        this.errorMessage = 'Error al cargar los departamentos';
        this.loadingDepartamentos = false;
      }
    });
  }

  loadCarrera() {
  if (this.carreraId) {
    this.loading = true;
    this.carreraService.findOne(this.carreraId).subscribe({
      next: (response: any) => {
        const carrera: Carrera = response.data;
        this.carreraForm.patchValue({
          nombre_carrera: carrera.nombre_carrera,
          codigo_carrera: carrera.codigo_carrera,
          duracion_semestres: carrera.duracion_semestres || null,
          titulo_otorga: carrera.titulo_otorga || '',
          estado: carrera.estado,
          id_departamento: carrera.departamento.id_departamento // ← Ya es number
        });
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

  onSubmit() {
    if (this.carreraForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = this.carreraForm.value;
      
      // Convertir duración a número si existe
      if (formValue.duracion_semestres) {
        formValue.duracion_semestres = Number(formValue.duracion_semestres);
      }

      if (this.isEdit && this.carreraId) {
        const updateData: UpdateCarrera = { ...formValue };
        this.carreraService.update(this.carreraId, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/carreras']);
          },
          error: (error) => {
            console.error('Error updating carrera:', error);
            this.errorMessage = error.error?.message || 'Error al actualizar la carrera';
            this.loading = false;
          }
        });
      } else {
        const createData: CreateCarrera = { ...formValue };
        this.carreraService.create(createData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/carreras']);
          },
          error: (error) => {
            console.error('Error creating carrera:', error);
            this.errorMessage = error.error?.message || 'Error al crear la carrera';
            this.loading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/carreras']);
  }

  private markFormGroupTouched() {
    Object.keys(this.carreraForm.controls).forEach(key => {
      const control = this.carreraForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación
  get nombre_carrera() {
    return this.carreraForm.get('nombre_carrera');
  }

  get codigo_carrera() {
    return this.carreraForm.get('codigo_carrera');
  }

  get id_departamento() {
    return this.carreraForm.get('id_departamento');
  }

  get titulo_otorga() {
    return this.carreraForm.get('titulo_otorga');
  }
}