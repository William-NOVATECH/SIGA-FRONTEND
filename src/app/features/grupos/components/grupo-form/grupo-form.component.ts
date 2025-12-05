import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GrupoService } from '../../services/grupo.service';
import { CarreraService } from '../../services/carrera.service';
import { Carrera, CreateGrupoDto, UpdateGrupoDto } from '../../models/grupo.model';
import { ToastService } from '../../../../core/services/toast.service';

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
    private toastService: ToastService
  ) {
    this.grupoForm = this.createForm();
  }

  async ngOnInit(): Promise<void> {
    // Cargar carreras primero
    await this.loadCarreras();

    // Luego cargar el grupo si estamos en modo edición
    this.route.params.subscribe(async params => {
      if (params['id']) {
        this.isEditMode = true;
        this.grupoId = +params['id'];
        // Asegurar que las carreras estén cargadas antes de cargar el grupo
        if (this.carreras.length === 0) {
          await this.loadCarreras();
        }
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
      next: (response: any) => {
        // Manejar diferentes formatos de respuesta del backend
        let grupo: any;
        if (response && typeof response === 'object') {
          if (response.data) {
            grupo = response.data;
          } else {
            grupo = response;
          }
        } else {
          grupo = response;
        }

        console.log('Grupo cargado:', grupo); // Para debugging

        // Obtener id_carrera: puede venir directamente o dentro de carrera
        let idCarrera: number | null = null;
        if (grupo.id_carrera) {
          idCarrera = Number(grupo.id_carrera);
        } else if (grupo.carrera?.id_carrera) {
          idCarrera = Number(grupo.carrera.id_carrera);
        }

        console.log('ID Carrera encontrado:', idCarrera); // Para debugging
        
        this.grupoForm.patchValue({
          id_carrera: idCarrera || '',
          codigo_grupo: grupo.codigo_grupo || '',
          nombre_grupo: grupo.nombre_grupo || '',
          periodo_academico: grupo.periodo_academico || '',
          min_asignaturas: grupo.min_asignaturas || '',
          max_asignaturas: grupo.max_asignaturas || '',
          estado: grupo.estado || 'activo'
        });
        
        // Verificar que el valor se asignó correctamente
        console.log('Valor de id_carrera en el formulario:', this.grupoForm.get('id_carrera')?.value);
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading grupo:', error);
        const errorMessage = error?.error?.message || 'No se pudo cargar el grupo. Por favor, intente nuevamente.';
        this.toastService.showError('Error al cargar grupo', errorMessage);
        this.isLoading = false;
      }
    });
  }

  async loadCarreras(): Promise<void> {
    return new Promise((resolve) => {
      this.carreraService.findAll().subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.carreras = response;
          } else if (response && typeof response === 'object' && 'data' in response) {
            this.carreras = Array.isArray(response.data) ? response.data : [response.data];
          } else {
            this.carreras = [];
          }
          resolve();
        },
        error: (error) => {
          console.error('Error cargando carreras:', error);
          this.carreras = [];
          this.toastService.showError(
            'Error al cargar carreras',
            'No se pudieron cargar las carreras. Por favor, intente nuevamente.'
          );
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
            this.isLoading = false;
            this.toastService.showSuccess(
              'Grupo actualizado',
              'El grupo se ha actualizado correctamente.'
            );
            this.router.navigate(['/grupos']);
          },
          error: (error) => {
            console.error('Error updating grupo:', error);
            const errorMessage = error?.error?.message || 'No se pudo actualizar el grupo. Por favor, intente nuevamente.';
            this.toastService.showError('Error al actualizar', errorMessage);
            this.isLoading = false;
          }
        });
      } else {
        const createDto: CreateGrupoDto = processedValue;

        this.grupoService.create(createDto).subscribe({
          next: () => {
            this.isLoading = false;
            this.toastService.showSuccess(
              'Grupo creado',
              'El grupo se ha creado correctamente.'
            );
            this.router.navigate(['/grupos']);
          },
          error: (error) => {
            console.error('Error creating grupo:', error);
            const errorMessage = error?.error?.message || 'No se pudo crear el grupo. Por favor, intente nuevamente.';
            this.toastService.showError('Error al crear', errorMessage);
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      this.toastService.showWarn(
        'Formulario inválido',
        'Por favor, complete todos los campos requeridos.'
      );
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