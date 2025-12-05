import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { CreateBulkGrupoAsignaturaDocente } from '../models/create-bulk-grupo-asignatura-docente.model';
import { PlanService } from '../../planes/services/plan.service';
import { Plan } from '../../planes/models/plan.model';
import { GrupoService } from '../../grupos/services/grupo.service';

@Component({
  selector: 'app-grupo-asignatura-docente-bulk-form',
  standalone: false,
  templateUrl: './grupo-asignatura-docente-bulk-form.component.html',
  styleUrls: ['./grupo-asignatura-docente-bulk-form.component.css']
})
export class GrupoAsignaturaDocenteBulkFormComponent implements OnInit {
  @Input() loading: boolean = false;
  @Input() grupos: any[] = [];
  @Input() asignaturas: any[] = [];
  @Input() docentes: any[] = [];
  
  @Output() submitForm = new EventEmitter<CreateBulkGrupoAsignaturaDocente>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  planes: Plan[] = [];
  loadingPlanes: boolean = false;
  selectedGrupoPlan: Plan | null = null;
  loadingGrupoPlan: boolean = false;

  estados = [
    { value: 'activa', label: 'Activa' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(
    private fb: FormBuilder,
    private planService: PlanService,
    private grupoService: GrupoService
  ) {
    this.form = this.fb.group({
      id_grupo: ['', [Validators.required, Validators.min(1)]],
      id_plan: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      estado: ['activa', [Validators.required]],
      observaciones: [''],
      asignaturas_docentes: this.fb.array([this.createAsignaturaDocenteItem()])
    });

    // Listener para cuando cambie el grupo
    this.form.get('id_grupo')?.valueChanges.subscribe((grupoId) => {
      if (grupoId) {
        this.loadGrupoPlan(Number(grupoId));
      } else {
        this.selectedGrupoPlan = null;
        this.form.get('id_plan')?.setValue('');
      }
    });
  }

  ngOnInit(): void {
    // Ya no necesitamos cargar todos los planes, solo el del grupo seleccionado
  }

  loadGrupoPlan(grupoId: number): void {
    this.loadingGrupoPlan = true;
    this.selectedGrupoPlan = null;
    
    this.grupoService.findOne(grupoId).subscribe({
      next: (grupo: any) => {
        // Obtener id_plan del grupo (puede venir directamente o en la relación plan)
        let idPlan: number | null = null;
        if (grupo.id_plan) {
          idPlan = Number(grupo.id_plan);
        } else if (grupo.plan?.id_plan) {
          idPlan = Number(grupo.plan.id_plan);
        }

        if (idPlan) {
          // Cargar los detalles del plan para mostrarlos
          this.planService.findOne(idPlan).subscribe({
            next: (plan: Plan) => {
              this.selectedGrupoPlan = plan;
              this.form.get('id_plan')?.setValue(idPlan);
              this.loadingGrupoPlan = false;
            },
            error: (error: any) => {
              console.error('Error loading plan:', error);
              // Aún así, establecer el id_plan aunque no tengamos los detalles
              this.form.get('id_plan')?.setValue(idPlan);
              this.loadingGrupoPlan = false;
            }
          });
        } else {
          this.loadingGrupoPlan = false;
          console.error('El grupo no tiene un plan asociado');
        }
      },
      error: (error: any) => {
        console.error('Error loading grupo:', error);
        this.loadingGrupoPlan = false;
      }
    });
  }

  // Corrección: Type casting explícito a FormArray
  get asignaturasDocentesArray(): FormArray {
    return this.form.get('asignaturas_docentes') as FormArray;
  }

  private createAsignaturaDocenteItem(): FormGroup {
    return this.fb.group({
      id_asignatura: ['', [Validators.required, Validators.min(1)]],
      id_docente: ['', [Validators.required, Validators.min(1)]]
    });
  }

  addAsignaturaDocente(): void {
    this.asignaturasDocentesArray.push(this.createAsignaturaDocenteItem());
  }

  removeAsignaturaDocente(index: number): void {
    if (this.asignaturasDocentesArray.length > 1) {
      this.asignaturasDocentesArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue(); // Usar getRawValue() para incluir campos disabled
      // Asegurar que id_plan sea un número
      const dto: CreateBulkGrupoAsignaturaDocente = {
        id_grupo: Number(formValue.id_grupo),
        id_plan: Number(formValue.id_plan),
        estado: formValue.estado,
        observaciones: formValue.observaciones || undefined,
        asignaturas_docentes: formValue.asignaturas_docentes.map((item: any) => ({
          id_asignatura: Number(item.id_asignatura),
          id_docente: Number(item.id_docente)
        }))
      };
      this.submitForm.emit(dto);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });

    // Corrección: Usar el getter que ya hace el type casting
    this.asignaturasDocentesArray.controls.forEach(control => {
      Object.keys((control as FormGroup).controls).forEach(key => {
        const subControl = (control as FormGroup).get(key);
        subControl?.markAsTouched();
      });
    });
  }

  getAsignaturaNombre(id: number): string {
    const asignatura = this.asignaturas.find(a => a.id_asignatura === id);
    return asignatura ? asignatura.nombre_asignatura : 'Seleccionar asignatura';
  }

getDocenteNombre(id: number): string {
  const docente = this.docentes.find(d => d.id_docente === id);
  return docente ? `${docente.nombres} ${docente.apellidos}` : 'Seleccionar docente';
}
}