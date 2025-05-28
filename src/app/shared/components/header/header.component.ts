import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../api/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class HeaderComponent {
  authService = inject(AuthService);

  constructor(private router: Router) {

  }

  get isLoggedIn(): boolean {
    // Add your authentication logic here
    // Example: return this.authService.isAuthenticated();
    // For now, check if we're not on login page
    return !this.router.url.includes('/login');
  }

  logout() {
    this.authService.logout();
  }
}
