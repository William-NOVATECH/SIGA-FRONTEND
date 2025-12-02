import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocenteService } from '../../services/docente.service';
import { CargoDocenteService } from '../../services/cargo-docente.service';
import { DepartamentoService } from '../../services/departamento.service';
import { Docente, CreateDocenteDto, UpdateDocenteDto } from '../../models/docente.model';
import { CargoDocente } from '../../models/cargo-docente.model';

interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
  codigo_departamento: string;
  estado: string;
}

@Component({
  selector: 'app-docente-form',
  templateUrl: './docente-form.component.html',
  styleUrls: ['./docente-form.component.css']
})
export class DocenteFormComponent implements OnInit {
  @Input() docenteId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  docenteForm: FormGroup;
  loading = false;
  saving = false;
  error = '';

  cargos: CargoDocente[] = [];
  departamentos: Departamento[] = [];

  constructor(
    private fb: FormBuilder,
    private docenteService: DocenteService,
    private cargoDocenteService: CargoDocenteService,
    private departamentoService: DepartamentoService
  ) {
    this.docenteForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('DocenteFormComponent iniciado, docenteId:', this.docenteId);
    this.loadCargos();
    this.loadDepartamentos();
    
    if (this.docenteId) {
      this.loadDocente();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      id_departamento: ['', [Validators.required]],
      id_cargo: ['', [Validators.required]],
      codigo_docente: ['', [Validators.required, Validators.maxLength(20)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      identificacion: ['', [Validators.required, Validators.maxLength(20)]],
      fecha_nacimiento: [''],
      genero: [''],
      estado: ['activo'],
      fecha_ingreso: ['']
    });
  }

  loadCargos(): void {
    console.log('Cargando cargos...');
    this.cargoDocenteService.findAll().subscribe({
      next: (cargos) => {
        console.log('Cargos cargados:', cargos);
        this.cargos = cargos;
      },
      error: (err) => {
        console.error('Error cargando cargos:', err);
        this.error = 'Error al cargar los cargos: ' + (err.error?.message || err.message);
      }
    });
  }

  loadDepartamentos(): void {
    console.log('Cargando departamentos...');
    this.departamentoService.findAll().subscribe({
      next: (response: any) => {
        console.log('Respuesta de departamentos:', response);
        
        if (Array.isArray(response)) {
          this.departamentos = response;
        } else if (response?.data && Array.isArray(response.data)) {
          this.departamentos = response.data;
        } else {
          console.error('Estructura de respuesta no reconocida:', response);
          this.error = 'Error: Estructura de datos de departamentos no reconocida';
          return;
        }
        
        console.log('Departamentos procesados:', this.departamentos);
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
        this.error = 'Error al cargar los departamentos: ' + (err.error?.message || err.message);
      }
    });
  }

  loadDocente(): void {
    if (!this.docenteId) return;

    this.loading = true;
    this.docenteService.findOne(this.docenteId).subscribe({
      next: (docente) => {
        console.log('Docente cargado:', docente);
        
        // Asegurar que los IDs sean números
        const id_departamento = Number(docente.id_departamento);
        const id_cargo = Number(docente.id_cargo);
        
        this.docenteForm.patchValue({
          id_departamento: id_departamento,
          id_cargo: id_cargo,
          codigo_docente: docente.codigo_docente,
          nombres: docente.nombres,
          apellidos: docente.apellidos,
          identificacion: docente.identificacion,
          fecha_nacimiento: docente.fecha_nacimiento,
          genero: docente.genero,
          estado: docente.estado,
          fecha_ingreso: docente.fecha_ingreso
        });
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el docente';
        this.loading = false;
        console.error('Error loading docente:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.docenteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    const formValue = this.docenteForm.value;

    // CONVERTIR LOS IDs A NÚMEROS
    const processedData = {
      ...formValue,
      id_departamento: Number(formValue.id_departamento),
      id_cargo: Number(formValue.id_cargo)
    };

    console.log('Enviando datos:', processedData);

    if (this.docenteId) {
      // Actualizar
      const updateDto: UpdateDocenteDto = processedData;
      this.docenteService.update(this.docenteId, updateDto).subscribe({
        next: () => {
          this.saving = false;
          this.saved.emit();
        },
        error: (err) => {
          this.handleError(err, 'actualizar');
        }
      });
    } else {
      // Crear
      const createDto: CreateDocenteDto = processedData;
      this.docenteService.create(createDto).subscribe({
        next: () => {
          this.saving = false;
          this.saved.emit();
        },
        error: (err) => {
          this.handleError(err, 'crear');
        }
      });
    }
  }

  private handleError(err: any, action: string): void {
    this.saving = false;
    
    if (err.status === 400) {
      if (err.error?.message?.includes('código')) {
        this.error = 'El código de docente ya está registrado';
      } else if (err.error?.message?.includes('identificación')) {
        this.error = 'La identificación ya está registrada';
      } else {
        this.error = `Error de validación al ${action} el docente: ${err.error?.message || 'Datos inválidos'}`;
      }
    } else if (err.status === 404) {
      this.error = 'Departamento o cargo no encontrado';
    } else {
      this.error = `Error al ${action} el docente: ${err.error?.message || err.message}`;
    }
    
    console.error(`Error ${action} docente:`, err);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.docenteForm.controls).forEach(key => {
      const control = this.docenteForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Getters para fácil acceso en el template
  get f() { return this.docenteForm.controls; }
}
