import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Group { id: string; name: string; }
export interface Interest { id: string; name: string; }

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  uf?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string };
  subscription?: {
    status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'HARD_BOUNCE' | 'COMPLAINT';
  };
  groups?: { group: Group }[];
  interests?: { interest: Interest }[];
}

export interface CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  uf?: string;
  description?: string;
  notes?: string;
  groupIds?: string[];
  interestIds?: string[];
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getContacts(filters?: { search?: string; groupId?: string; interestId?: string }): Observable<Contact[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.groupId) params = params.set('groupId', filters.groupId);
    if (filters?.interestId) params = params.set('interestId', filters.interestId);

    return this.http.get<Contact[]>(`${this.apiUrl}/contacts`, { params });
  }

  createContact(dto: CreateContactDto): Observable<Contact> {
    return this.http.post<Contact>(`${this.apiUrl}/contacts`, dto);
  }

  updateContact(id: string, dto: Partial<CreateContactDto>): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/contacts/${id}`, dto);
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/groups`);
  }

  getInterests(): Observable<Interest[]> {
    return this.http.get<Interest[]>(`${this.apiUrl}/interests`);
  }

  deleteContact(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/contacts/${id}`);
  }

  unsubscribeContact(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/contacts/${id}/unsubscribe`, {});
  }

  resubscribeContact(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/contacts/${id}/resubscribe`, {});
  }
}