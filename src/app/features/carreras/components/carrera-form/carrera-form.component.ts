// features/carreras/components/carrera-form/carrera-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarreraService } from '../../services/carrera.service';
import { DepartamentoService, Departamento } from '../../services/departamento.service';
import { CreateCarrera, UpdateCarrera, Carrera } from '../../models/carrera.model';
import { ToastService } from '../../../../core/services/toast.service';
import { RolService } from '../../../admin/services/rol.service';
import { Usuario } from '../../../admin/interfaces/usuario.interface';

@Component({
  selector: 'app-carrera-form',
  standalone: false,
  templateUrl: './carrera-form.component.html',
  styleUrls: ['./carrera-form.component.css']
})
export class CarreraFormComponent implements OnInit {
  carreraForm: FormGroup;
  isEdit = false;
  loading = false;
  loadingDepartamentos = false;
  loadingCoordinadores = false;
  carreraId?: number;
  departamentos: Departamento[] = [];
  coordinadores: Usuario[] = [];
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private carreraService: CarreraService,
    private departamentoService: DepartamentoService,
    private rolService: RolService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.carreraForm = this.fb.group({
      nombre_carrera: ['', [Validators.required, Validators.maxLength(200)]],
      codigo_carrera: ['', [Validators.required, Validators.maxLength(20)]],
      duracion_semestres: ['null'],
      titulo_otorga: ['', [Validators.maxLength(100)]],
      estado: ['activa'],
      id_departamento: ['null', Validators.required],
      id_coordinador: [null]
    });
  }

  ngOnInit() {
    this.loadDepartamentos();
    this.loadCoordinadores();
    
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
        this.toastService.showError(
          'Error al cargar departamentos',
          'No se pudieron cargar los departamentos. Por favor, intente nuevamente.'
        );
        this.loadingDepartamentos = false;
      }
    });
  }

  loadCoordinadores() {
    this.loadingCoordinadores = true;
    this.rolService.getUsuariosConRoles().subscribe({
      next: (usuarios) => {
        // Filtrar usuarios que tengan el rol de coordinador (id_rol: 2)
        this.coordinadores = usuarios.filter(usuario => {
          // Verificar si el usuario tiene el rol activo de coordinador
          if (usuario.rol && usuario.rol.rol.id_rol === 2) {
            return true;
          }
          // También verificar en el array de roles si existe
          if (usuario.roles && usuario.roles.length > 0) {
            return usuario.roles.some(r => r.rol.id_rol === 2 && r.estado === 'activo');
          }
          return false;
        });
        this.loadingCoordinadores = false;
      },
      error: (error) => {
        console.error('Error loading coordinadores:', error);
        this.toastService.showError(
          'Error al cargar coordinadores',
          'No se pudieron cargar los coordinadores. Por favor, intente nuevamente.'
        );
        this.loadingCoordinadores = false;
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
            id_departamento: carrera.departamento.id_departamento,
            id_coordinador: carrera.coordinador?.id_usuario || null
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading carrera:', error);
          this.errorMessage = 'Error al cargar la carrera';
          const errorMessage = error?.error?.message || 'No se pudo cargar la carrera. Por favor, intente nuevamente.';
          this.toastService.showError('Error al cargar carrera', errorMessage);
          this.loading = false;
        }
      });
    }
  }

  onSubmit() {
    if (this.carreraForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = { ...this.carreraForm.value };
      
      // Convertir duración a número si existe y no es null/undefined
      if (formValue.duracion_semestres && formValue.duracion_semestres !== 'null' && formValue.duracion_semestres !== null) {
        formValue.duracion_semestres = Number(formValue.duracion_semestres);
      } else {
        delete formValue.duracion_semestres;
      }

      // Manejar id_coordinador - solo incluir si tiene valor
      if (!formValue.id_coordinador || formValue.id_coordinador === 'null' || formValue.id_coordinador === null) {
        delete formValue.id_coordinador;
      } else {
        formValue.id_coordinador = Number(formValue.id_coordinador);
      }

      // Manejar id_departamento - asegurar que sea número
      if (formValue.id_departamento && formValue.id_departamento !== 'null' && formValue.id_departamento !== null) {
        formValue.id_departamento = Number(formValue.id_departamento);
      }

      if (this.isEdit && this.carreraId) {
        const updateData: UpdateCarrera = { ...formValue };
        this.carreraService.update(this.carreraId, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.toastService.showSuccess(
              'Carrera actualizada',
              'La carrera se ha actualizado correctamente.'
            );
            this.router.navigate(['/carreras']);
          },
          error: (error) => {
            console.error('Error updating carrera:', error);
            const errorMessage = error?.error?.message || 'No se pudo actualizar la carrera. Por favor, intente nuevamente.';
            this.errorMessage = errorMessage;
            this.toastService.showError('Error al actualizar', errorMessage);
            this.loading = false;
          }
        });
      } else {
        const createData: CreateCarrera = { ...formValue };
        this.carreraService.create(createData).subscribe({
          next: () => {
            this.loading = false;
            this.toastService.showSuccess(
              'Carrera creada',
              'La carrera se ha creado correctamente.'
            );
            this.router.navigate(['/carreras']);
          },
          error: (error) => {
            console.error('Error creating carrera:', error);
            const errorMessage = error?.error?.message || 'No se pudo crear la carrera. Por favor, intente nuevamente.';
            this.errorMessage = errorMessage;
            this.toastService.showError('Error al crear', errorMessage);
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

  get id_coordinador() {
    return this.carreraForm.get('id_coordinador');
  }
}