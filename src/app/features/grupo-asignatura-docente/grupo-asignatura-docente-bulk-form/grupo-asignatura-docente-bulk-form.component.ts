import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
export class GrupoAsignaturaDocenteBulkFormComponent implements OnInit, OnChanges {
  @Input() loading: boolean = false;
  @Input() grupos: any[] = [];
  @Input() asignaturas: any[] = [];
  @Input() docentes: any[] = [];
  @Input() grupoIdInicial?: number; // ID del grupo a preseleccionar
  
  @Output() submitForm = new EventEmitter<CreateBulkGrupoAsignaturaDocente>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  planes: Plan[] = [];
  loadingPlanes: boolean = false;
  selectedGrupoPlan: Plan | null = null;
  loadingGrupoPlan: boolean = false;
  selectedGrupoCarrera: any = null;
  filteredAsignaturas: any[] = [];
  asignaturasSeleccionadas: Map<number, number> = new Map(); // Map<id_asignatura, id_docente>

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
      observaciones: ['']
    });

    // Listener para cuando cambie el grupo
    this.form.get('id_grupo')?.valueChanges.subscribe((grupoId) => {
      if (grupoId) {
        this.loadGrupoPlan(Number(grupoId));
      } else {
        this.selectedGrupoPlan = null;
        this.selectedGrupoCarrera = null;
        this.filteredAsignaturas = [];
        this.asignaturasSeleccionadas.clear();
        this.form.get('id_plan')?.setValue('');
      }
    });
  }

  ngOnInit(): void {
    // Si hay un grupo inicial, preseleccionarlo
    if (this.grupoIdInicial) {
      this.preseleccionarGrupo(this.grupoIdInicial);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si el grupoIdInicial cambia después de la inicialización, actualizar el formulario
    if (changes['grupoIdInicial'] && !changes['grupoIdInicial'].firstChange && this.grupoIdInicial) {
      this.preseleccionarGrupo(this.grupoIdInicial);
    }
    
    // Si los grupos se cargan y hay un grupoIdInicial, preseleccionarlo
    if (changes['grupos'] && this.grupoIdInicial && this.grupos.length > 0) {
      // Verificar que el grupo existe en la lista
      const grupoExiste = this.grupos.some(g => g.id_grupo === this.grupoIdInicial);
      if (grupoExiste) {
        this.preseleccionarGrupo(this.grupoIdInicial);
      }
    }
    
    // Si las asignaturas se cargan y ya hay una carrera seleccionada, filtrar nuevamente
    if (changes['asignaturas'] && this.selectedGrupoCarrera && this.asignaturas.length > 0) {
      console.log('Asignaturas cargadas, re-filtrando por carrera:', this.selectedGrupoCarrera);
      this.filterAsignaturasByCarrera(this.selectedGrupoCarrera.id_carrera);
    }
  }

  private preseleccionarGrupo(grupoId: number): void {
    // Usar setTimeout para asegurar que el formulario esté completamente inicializado
    setTimeout(() => {
      const currentValue = this.form.get('id_grupo')?.value;
      if (currentValue !== grupoId) {
        this.form.get('id_grupo')?.setValue(grupoId);
        // El valueChanges se disparará automáticamente y cargará el plan
      }
    }, 0);
  }

  loadGrupoPlan(grupoId: number): void {
    this.loadingGrupoPlan = true;
    this.selectedGrupoPlan = null;
    this.selectedGrupoCarrera = null;
    this.filteredAsignaturas = [];
    this.asignaturasSeleccionadas.clear();
    
    this.grupoService.findOne(grupoId).subscribe({
      next: (grupo: any) => {
        console.log('Grupo cargado:', grupo);
        // Obtener la carrera del grupo
        if (grupo.carrera) {
          this.selectedGrupoCarrera = grupo.carrera;
          console.log('Carrera del grupo:', grupo.carrera);
          console.log('ID de carrera:', grupo.carrera.id_carrera);
          console.log('Asignaturas disponibles:', this.asignaturas.length);
          this.filterAsignaturasByCarrera(grupo.carrera.id_carrera);
        } else {
          console.warn('El grupo no tiene carrera asociada:', grupo);
        }

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

  filterAsignaturasByCarrera(idCarrera: number): void {
    console.log('Filtrando asignaturas por carrera ID:', idCarrera);
    console.log('Total de asignaturas disponibles:', this.asignaturas.length);
    
    if (!this.asignaturas || this.asignaturas.length === 0) {
      console.warn('No hay asignaturas disponibles para filtrar');
      this.filteredAsignaturas = [];
      return;
    }
    
    // Mostrar estructura de las primeras asignaturas para debug
    if (this.asignaturas.length > 0) {
      console.log('Estructura de primera asignatura:', this.asignaturas[0]);
    }
    
    this.filteredAsignaturas = this.asignaturas.filter((asignatura: any) => {
      const asignaturaCarreraId = asignatura.id_carrera || asignatura.carrera?.id_carrera;
      const match = asignaturaCarreraId === idCarrera;
      
      if (!match) {
        console.log(`Asignatura ${asignatura.nombre_asignatura} (ID: ${asignatura.id_asignatura}) no coincide - tiene carrera ID: ${asignaturaCarreraId}, buscamos: ${idCarrera}`);
      }
      
      return match;
    });
    
    console.log(`Asignaturas filtradas: ${this.filteredAsignaturas.length} de ${this.asignaturas.length}`);
    console.log('Asignaturas filtradas:', this.filteredAsignaturas.map((a: any) => ({
      id: a.id_asignatura,
      nombre: a.nombre_asignatura,
      carrera: a.id_carrera || a.carrera?.id_carrera
    })));
  }

  onAsignaturaDocenteChange(idAsignatura: number, idDocente: number | null): void {
    if (idDocente && idDocente > 0) {
      this.asignaturasSeleccionadas.set(idAsignatura, idDocente);
    } else {
      this.asignaturasSeleccionadas.delete(idAsignatura);
    }
  }

  getDocenteForAsignatura(idAsignatura: number): number | null {
    return this.asignaturasSeleccionadas.get(idAsignatura) || null;
  }

  isAsignaturaSelected(idAsignatura: number): boolean {
    return this.asignaturasSeleccionadas.has(idAsignatura);
  }


  onSubmit(): void {
    // Validar que haya al menos una asignación seleccionada
    if (this.asignaturasSeleccionadas.size === 0) {
      alert('Debe seleccionar al menos una asignatura con su docente');
      return;
    }

    if (this.form.valid) {
      const formValue = this.form.getRawValue(); // Usar getRawValue() para incluir campos disabled
      
      // Convertir el Map a array de asignaturas_docentes
      const asignaturasDocentes = Array.from(this.asignaturasSeleccionadas.entries()).map(([idAsignatura, idDocente]) => ({
        id_asignatura: Number(idAsignatura),
        id_docente: Number(idDocente)
      }));

      const dto: CreateBulkGrupoAsignaturaDocente = {
        id_grupo: Number(formValue.id_grupo),
        id_plan: Number(formValue.id_plan),
        estado: formValue.estado,
        observaciones: formValue.observaciones || undefined,
        asignaturas_docentes: asignaturasDocentes
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