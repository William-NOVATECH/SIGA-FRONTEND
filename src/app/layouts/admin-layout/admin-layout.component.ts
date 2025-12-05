import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone:false,
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  navItem: any[] = [
    {
      displayName: 'Navbar',
      iconName: 'dashboard',
      route: '/navbar'
    }
  ];

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
