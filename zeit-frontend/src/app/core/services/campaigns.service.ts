import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  contentHtml: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'CANCELLED' | 'FAILED';
  createdAt: string;
  startedAt?: string;
  _count?: { recipients: number };
}

export interface CreateCampaignDto {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  contentHtml: string;
}

export interface TriggerCampaignDto {
  groupIds?: string[];
  interestIds?: string[];
}

export interface CampaignStats {
  campaignId: string;
  campaignName: string;
  status: string;
  metrics: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
    uniqueOpens: number;
    uniqueClicks: number;
  };
  rates: {
    deliveryRate: string;
    openRate: string;
    clickRate: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CampaignsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/campaigns`);
  }

  getCampaignStats(campaignId: string): Observable<CampaignStats> {
    return this.http.get<CampaignStats>(`${this.apiUrl}/stats/campaigns/${campaignId}`);
  }

  createCampaign(dto: CreateCampaignDto): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/campaigns`, dto);
  }

  sendTest(campaignId: string, email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/campaigns/${campaignId}/test`, { email });
  }

  triggerCampaign(campaignId: string, dto: TriggerCampaignDto): Observable<{ message: string; totalRecipients: number }> {
    return this.http.post<{ message: string; totalRecipients: number }>(`${this.apiUrl}/campaigns/${campaignId}/send`, dto);
  }

  updateCampaign(id: string, dto: Partial<CreateCampaignDto>): Observable<Campaign> {
  return this.http.put<Campaign>(`${this.apiUrl}/campaigns/${id}`, dto);
}
}