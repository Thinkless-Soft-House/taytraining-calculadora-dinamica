import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../api/services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const token = localStorage.getItem('accessToken');

  if (!token) {
    router.navigate(['/admin/login']);
    return false;
  }

  // console.log('Token found:', token);
  // console.log('User found, like to continue');

  // Retorna true em vez do token
  return true;
};
