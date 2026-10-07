import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OverviewStats {
  contacts: {
    total: number;
    activeSubscribers: number;
    unsubscribed: number;
    hardBounces: number;
    complaints: number;
  };
  totalCampaigns: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<OverviewStats> {
    return this.http.get<OverviewStats>(`${this.apiUrl}/stats/overview`);
  }
}