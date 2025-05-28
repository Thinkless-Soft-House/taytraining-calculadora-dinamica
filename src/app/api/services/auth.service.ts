import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  firstValueFrom,
  map,
  Observable,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { User } from '../model/users.model';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  protected endpoint: string = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    // private dialog: MatDialog,
  ) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.endpoint}/auth/login`, credentials).pipe(
      tap((response) => {
        const accessToken = response?.access_token;

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        } else {
          throw new Error('Access token or user not found in response');
        }
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/app/login']);
  }


  register(payload: User): Observable<any> {
    return this.http.post<any>(`${this.endpoint}/auth/register`, payload).pipe(
      tap((response) => {
        console.log('User registered successfully:', response);
      }),
    );
  }
}
