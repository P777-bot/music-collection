import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number;
  email: string;
  createdAt: string;
  role: 'USER' | 'ADMIN';
}

interface AuthResponse { user: AuthUser }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl.replace(/\/+$/, '')}/auth`;
  readonly user = signal<AuthUser | null>(null);

  register(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, { email, password }, { withCredentials: true })
      .pipe(map(({ user }) => user), tap(user => this.user.set(user)));
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(map(({ user }) => user), tap(user => this.user.set(user)));
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthResponse>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(map(({ user }) => user), tap(user => this.user.set(user)), catchError(error => {
        this.user.set(null);
        return throwError(() => error);
      }));
  }

  restoreSession(): Observable<AuthUser | null> {
    return this.getCurrentUser().pipe(catchError(() => of(null)));
  }

  logout(): Observable<boolean> {
    return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      map(() => {
        this.user.set(null);
        return true;
      }),
      catchError(() => of(false)),
    );
  }
}
