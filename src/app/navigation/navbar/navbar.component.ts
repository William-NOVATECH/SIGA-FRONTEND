import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone:false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  logoImage: string = 'assets/images/unan.png';
  userInitials: string = 'U';
  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    // Intentar obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      this.userInitials = this.authService.getUserInitials();
    } else {
      // Si no hay usuario guardado, intentar obtenerlo del backend
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
            this.userInitials = this.authService.getUserInitials();
          }
        },
        error: (error) => {
          console.error('Error loading user:', error);
        }
      });
    }
  }

  logOut() {
    this.authService.logOut();
  }
}