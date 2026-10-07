import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MARKETING';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ access_token: string; user: User }>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem('zeit_token', res.access_token);
        localStorage.setItem('zeit_user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('zeit_token');
    localStorage.removeItem('zeit_user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('zeit_token');
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('zeit_user');
    return user ? JSON.parse(user) : null;
  }
}