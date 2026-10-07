import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-unsubscribe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unsubscribe.component.html',
})
export class UnsubscribeComponent implements OnInit {
  token = '';
  isLoading = false;
  isDone = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
    });
  }

  confirmUnsubscribe(): void {
    if (!this.token) {
      this.errorMessage = 'Link de descadastro inválido ou expirado.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .post(`${environment.apiUrl}/public/contacts/unsubscribe`, { token: this.token })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.isDone = true;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao processar sua solicitação de descadastro.';
        },
      });
  }
}