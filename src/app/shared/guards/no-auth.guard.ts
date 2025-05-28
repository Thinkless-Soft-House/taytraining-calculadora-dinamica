import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('access_token');

  if (!!token) {
    const router = inject(Router);
    router.navigate(['/app/login']);
    return false;
  } else {
    return true;
  }
};
