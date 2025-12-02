import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartamentoService } from '../../services/departamento.service';
import { CreateDepartamento, UpdateDepartamento } from '../../models/departamento.model';

@Component({
  selector: 'app-departamento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departamento-form.component.html',
  styleUrls: ['./departamento-form.component.css']
})
export class DepartamentoFormComponent implements OnInit {
  departamentoForm: FormGroup;
  isEdit = false;
  loading = false;
  departamentoId?: number;

  constructor(
    private fb: FormBuilder,
    private departamentoService: DepartamentoService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.departamentoForm = this.fb.group({
      nombre_departamento: ['', [Validators.required, Validators.maxLength(100)]],
      codigo_departamento: ['', [Validators.required, Validators.maxLength(10)]],
      estado: ['activo']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.departamentoId = +params['id'];
        this.loadDepartamento();
      }
    });
  }

  loadDepartamento() {
    if (this.departamentoId) {
      this.loading = true;
      this.departamentoService.findOne(this.departamentoId).subscribe({
        next: (departamento) => {
          this.departamentoForm.patchValue(departamento);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading departamento:', error);
          this.loading = false;
        }
      });
    }
  }

  onSubmit() {
    if (this.departamentoForm.valid) {
      this.loading = true;
      const formValue = this.departamentoForm.value;

      if (this.isEdit && this.departamentoId) {
        const updateData: UpdateDepartamento = { ...formValue };
        this.departamentoService.update(this.departamentoId, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/departamentos']);
          },
          error: (error) => {
            console.error('Error updating departamento:', error);
            this.loading = false;
          }
        });
      } else {
        const createData: CreateDepartamento = { ...formValue };
        this.departamentoService.create(createData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/departamentos']);
          },
          error: (error) => {
            console.error('Error creating departamento:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/departamentos']);
  }

  get nombre_departamento() {
    return this.departamentoForm.get('nombre_departamento');
  }

  get codigo_departamento() {
    return this.departamentoForm.get('codigo_departamento');
  }
}