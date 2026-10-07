import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { CampaignsService, Campaign, CreateCampaignDto, CampaignStats } from '../../core/services/campaigns.service';
import { GroupsInterestsService, Group, Interest } from '../../core/services/groups-interests.service';
import { AuthService } from '../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router'; // Importe ActivatedRoute e Router

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaigns.component.html',
})

export class CampaignsComponent implements OnInit {
  role: string | undefined;
  campaigns: Campaign[] = [];
  groups: Group[] = [];
  interests: Interest[] = [];

  isLoading = false;
  isSaving = false;
  isSendingTest = false;
  isTriggering = false;
  isLoadingStats = false;

  showCreateModal = false;
  showSendModal = false;
  showStatsModal = false;

  // Controle das Abas de Edição / Preview
  createTab: 'edit' | 'preview' = 'edit';
  sendTab: 'edit' | 'preview' = 'edit';

  selectedCampaignForSend: Campaign | null = null;
  selectedCampaignStats: CampaignStats | null = null;

  // Edição pré-envio
  sendSubject = '';
  sendContentHtml = '';

  errorMessage = '';
  successMessage = '';
  testEmail = '';

  newCampaign: CreateCampaignDto = this.getEmptyForm();
  selectedGroupIds: string[] = [];
  selectedInterestIds: string[] = [];

  isUpdating = false;

  constructor(
    private campaignsService: CampaignsService,
    private authService: AuthService,
    private groupsInterestsService: GroupsInterestsService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => {
      this.role = u?.role;
    });

    this.loadCampaigns();
    this.loadSegmentationData();
    this.checkPendingBuilderHtml();
  }

  checkPendingBuilderHtml(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['fromBuilder'] === 'true') {
        const pendingHtml = localStorage.getItem('pending_campaign_html');

        if (pendingHtml) {
          // Abre o modal de criação e insere o HTML
          this.openCreateModal();
          this.newCampaign.contentHtml = pendingHtml;
          this.createTab = 'preview'; // Abre direto na aba de preview visual

          // Limpa a pendência do storage
          localStorage.removeItem('pending_campaign_html');

          // Limpa a URL removendo os queryParams
          this.router.navigate([], { queryParams: {} });
        }
      }
    });
  }

  getEmptyForm(): CreateCampaignDto {
    return {
      name: '',
      subject: '',
      fromName: 'Equipe Zeit',
      fromEmail: 'news@zeit.com.br',
      contentHtml: '<div style="font-family: sans-serif; padding: 20px;"><h1>Olá!</h1><p>Confira nossas atualizações.</p></div>',
    };
  }

  // Converte HTML em formato seguro para o Angular renderizar
  getSanitizedHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '<p class="text-slate-500">Sem conteúdo para visualizar.</p>');
  }

  loadCampaigns(): void {
    this.isLoading = true;
    this.campaignsService
      .getCampaigns()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.campaigns = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao carregar campanhas.';
          this.cdr.detectChanges();
        },
      });
  }

  loadSegmentationData(): void {
    this.groupsInterestsService.getGroups().subscribe((g) => {
      this.groups = g;
      this.cdr.detectChanges();
    });
    this.groupsInterestsService.getInterests().subscribe((i) => {
      this.interests = i;
      this.cdr.detectChanges();
    });
  }

  openCreateModal(): void {
    this.newCampaign = this.getEmptyForm();
    this.createTab = 'edit';
    this.errorMessage = '';
    this.showCreateModal = true;
  }

  openSendModal(campaign: Campaign): void {
    this.selectedCampaignForSend = campaign;
    this.sendSubject = campaign.subject;
    this.sendContentHtml = campaign.contentHtml;
    this.sendTab = 'edit';
    this.selectedGroupIds = [];
    this.selectedInterestIds = [];
    this.testEmail = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showSendModal = true;
  }

  openStatsModal(campaign: Campaign): void {
    this.selectedCampaignStats = null;
    this.isLoadingStats = true;
    this.showStatsModal = true;

    this.campaignsService
      .getCampaignStats(campaign.id)
      .pipe(
        finalize(() => {
          this.isLoadingStats = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (stats) => {
          this.selectedCampaignStats = stats;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao carregar estatísticas da campanha.';
          this.cdr.detectChanges();
        },
      });
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showSendModal = false;
    this.showStatsModal = false;
    this.selectedCampaignForSend = null;
    this.selectedCampaignStats = null;
  }

  toggleGroup(id: string): void {
    const index = this.selectedGroupIds.indexOf(id);
    index > -1 ? this.selectedGroupIds.splice(index, 1) : this.selectedGroupIds.push(id);
  }

  toggleInterest(id: string): void {
    const index = this.selectedInterestIds.indexOf(id);
    index > -1 ? this.selectedInterestIds.splice(index, 1) : this.selectedInterestIds.push(id);
  }

  saveCampaign(): void {
    if (!this.newCampaign.name || !this.newCampaign.subject || !this.newCampaign.contentHtml) {
      this.errorMessage = 'Nome interno, assunto e HTML são obrigatórios.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.campaignsService
      .createCampaign(this.newCampaign)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeModals();
          this.loadCampaigns();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao criar campanha.';
        },
      });
  }

  sendTestMail(): void {
    if (!this.selectedCampaignForSend || !this.testEmail) {
      this.errorMessage = 'Informe o e-mail para teste.';
      return;
    }

    this.isSendingTest = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.campaignsService
      .sendTest(this.selectedCampaignForSend.id, this.testEmail)
      .pipe(
        finalize(() => {
          this.isSendingTest = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.successMessage = res.message;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao enviar e-mail de teste.';
        },
      });
  }

  triggerCampaign(): void {
    if (!this.selectedCampaignForSend) return;

    this.isTriggering = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Atualiza com as alterações feitas na tela de disparo
    this.selectedCampaignForSend.subject = this.sendSubject;
    this.selectedCampaignForSend.contentHtml = this.sendContentHtml;

    this.campaignsService
      .triggerCampaign(this.selectedCampaignForSend.id, {
        groupIds: this.selectedGroupIds,
        interestIds: this.selectedInterestIds,
      })
      .pipe(
        finalize(() => {
          this.isTriggering = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.successMessage = `${res.message} Target: ${res.totalRecipients} destinatários.`;
          setTimeout(() => {
            this.closeModals();
            this.loadCampaigns();
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao disparar campanha.';
        },
      });
  }
  saveSendModalEdits(): void {
    if (!this.selectedCampaignForSend) return;

    this.isUpdating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.campaignsService
      .updateCampaign(this.selectedCampaignForSend.id, {
        subject: this.sendSubject,
        contentHtml: this.sendContentHtml,
      })
      .pipe(
        finalize(() => {
          this.isUpdating = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          this.successMessage = 'Rascunho atualizado com sucesso!';
          if (this.selectedCampaignForSend) {
            this.selectedCampaignForSend.subject = updated.subject;
            this.selectedCampaignForSend.contentHtml = updated.contentHtml;
          }
          this.loadCampaigns();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao salvar alterações da campanha.';
        },
      });
  }
}