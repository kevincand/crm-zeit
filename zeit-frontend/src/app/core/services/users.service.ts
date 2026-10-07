import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MARKETING';
  active: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MARKETING';
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(`${this.apiUrl}/users`);
  }

  createUser(dto: CreateUserDto): Observable<SystemUser> {
    return this.http.post<SystemUser>(`${this.apiUrl}/users`, dto);
  }

  updateUser(id: string, dto: { role?: string; active?: boolean }): Observable<SystemUser> {
    return this.http.patch<SystemUser>(`${this.apiUrl}/users/${id}`, dto);
  }

  updatePassword(id: string, password: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/users/${id}/password`, { password });
  }
}