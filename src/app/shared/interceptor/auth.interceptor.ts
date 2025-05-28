import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService } from '../../api/services/auth.service';


export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const token = localStorage.getItem('accessToken');

  if (!req.url.includes('/app/login') && token) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(req).pipe(
    // map(res => {
    //   throw {status: 403};
    // }),
    catchError((error: HttpErrorResponse): Observable<any> => {
      if (error.status === 403 && !req.url.includes('/app/login')) {
        authService.logout();
      }

      return new Observable(observer => {
        observer.error(error);
      });
    })
  );
};
