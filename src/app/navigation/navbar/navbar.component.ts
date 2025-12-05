import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone:false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  logoImage: string = 'assets/images/unan.png';

  constructor(private router: Router) {}

  logOut() {
    console.log('Cerrando sesión...');
    this.router.navigate(['/auth/login']);
  }
}