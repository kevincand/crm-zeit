import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Group {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  _count?: { contacts: number };
}

export interface Interest {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  _count?: { contacts: number };
}

@Injectable({
  providedIn: 'root'
})
export class GroupsInterestsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Grupos
  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/groups`);
  }

  createGroup(dto: { name: string; description?: string }): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/groups`, dto);
  }

  // Interesses
  getInterests(): Observable<Interest[]> {
    return this.http.get<Interest[]>(`${this.apiUrl}/interests`);
  }

  createInterest(dto: { name: string; description?: string }): Observable<Interest> {
    return this.http.post<Interest>(`${this.apiUrl}/interests`, dto);
  }
}