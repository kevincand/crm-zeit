import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-import-leads',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-leads.component.html',
})
export class ImportLeadsComponent {
  selectedFile: File | null = null;
  isUploading = false;
  importResult: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  downloadTemplate(): void {
    const token = localStorage.getItem('token'); // Ou o seu gerenciador de sessão
    this.http.get(`${environment.apiUrl}/contacts/import/template`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modelo_importacao_zeit.xlsx';
      a.click();
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
    this.importResult = null;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const token = localStorage.getItem('token');

    this.isUploading = true;
    this.http.post(`${environment.apiUrl}/contacts/import`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.importResult = res;
        this.selectedFile = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploading = false;
        alert(err.error?.message || 'Erro na importação.');
        this.cdr.detectChanges();
      },
    });
  }
}