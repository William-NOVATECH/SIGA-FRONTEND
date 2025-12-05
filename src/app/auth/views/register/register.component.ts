import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordFieldType = 'password';
  confirmPasswordFieldType = 'password';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Getter para fácil acceso a los campos del formulario
  get f() { return this.registerForm.controls; }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.confirmPasswordFieldType = this.showConfirmPassword ? 'text' : 'password';
  }

  onSubmit(): void {
    this.submitted = true;

    // Si el formulario es inválido, detener el proceso
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    const registerData = {
      username: this.f['username'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      id_rol: 6 // Rol de invitado asignado automáticamente
    };

    this.authService.registerUser(registerData)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario registrado correctamente. Redirigiendo al login...'
          });

          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);

          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          
          let errorMessage = 'Error al registrar usuario. Por favor, intente nuevamente.';
          
          if (error.status === 400) {
            errorMessage = error.error.message || 'Datos de registro inválidos.';
          } else if (error.status === 409) {
            errorMessage = 'El usuario o email ya existe.';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
      });
  }

  // Método para limpiar el formulario
  clearForm(): void {
    this.submitted = false;
    this.registerForm.reset();
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.passwordFieldType = 'password';
    this.confirmPasswordFieldType = 'password';
  }

  // Ir al login
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}