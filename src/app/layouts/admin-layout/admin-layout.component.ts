import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goToNavbar(): void {
    this.router.navigate(['/navbar']);
  }

  goToSystem() {
  this.router.navigate(['/navbar']);
}

 logout(): void {
  this.authService.logOut(); 
  this.router.navigate(['/auth/login']);
}
}
