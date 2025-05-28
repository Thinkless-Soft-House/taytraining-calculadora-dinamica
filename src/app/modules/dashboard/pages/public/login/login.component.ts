import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../api/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = new FormGroup({
      email: new FormControl('caio@thinkless.com.br', [Validators.required, Validators.email]),
      password: new FormControl('123456', [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.snackBar.open('Login realizado com sucesso!', '✓', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.router.navigate(['/app/menu']);
        },
        error: (error) => {
          console.error('Login failed', error);
          const errorMessage = error.error?.message || 'Erro ao fazer login. Tente novamente.';
          this.snackBar.open(errorMessage, '✕', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        }
      });
    }
  }
}
