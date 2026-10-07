import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ContactsService, Contact, Group, Interest, CreateContactDto } from '../../core/services/contacts.service';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.component.html',
})
export class ContactsComponent implements OnInit {
  contacts: Contact[] = [];
  groups: Group[] = [];
  interests: Interest[] = [];

  isLoading = false;
  isSaving = false;
  showModal = false;
  selectedContactDetails: Contact | null = null;
  editingContactId: string | null = null;

  errorMessage = '';

  search = '';
  selectedGroupId = '';
  selectedInterestId = '';

  formContact: CreateContactDto = this.getEmptyForm();

  contactToDelete: Contact | null = null;
  showDeleteModal = false;
  isDeleting = false;

  showUnsubscribeModal = false;
  contactToUnsubscribe: Contact | null = null;
  isUnsubscribing = false;

  showResubscribeModal = false;
  contactToResubscribe: Contact | null = null;
  isResubscribing = false;

  constructor(
    private contactsService: ContactsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadFiltersData();
    this.loadContacts();
  }

  getEmptyForm(): CreateContactDto {
    return { name: '', email: '', phone: '', company: '', uf: '', description: '', notes: '', groupIds: [], interestIds: [] };
  }

  loadFiltersData(): void {
    this.contactsService.getGroups().subscribe({
      next: (g) => {
        this.groups = g;
        this.cdr.detectChanges();
      }
    });
    this.contactsService.getInterests().subscribe({
      next: (i) => {
        this.interests = i;
        this.cdr.detectChanges();
      }
    });
  }

  loadContacts(): void {
    this.isLoading = true;
    this.contactsService
      .getContacts({ search: this.search, groupId: this.selectedGroupId, interestId: this.selectedInterestId })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.contacts = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao carregar contatos.';
          this.cdr.detectChanges();
        },
      });
  }

  openCreateModal(): void {
    this.editingContactId = null;
    this.formContact = this.getEmptyForm();
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(contact: Contact): void {
    this.editingContactId = contact.id;
    this.formContact = {
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      uf: contact.uf || '',
      description: contact.description || '',
      notes: contact.notes || '',
      groupIds: contact.groups?.map((g) => g.group.id) || [],
      interestIds: contact.interests?.map((i) => i.interest.id) || [],
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  viewDetails(contact: Contact): void {
    this.selectedContactDetails = contact;
  }

  closeDetails(): void {
    this.selectedContactDetails = null;
  }

  closeModal(): void {
    this.showModal = false;
    this.isSaving = false;
  }

  toggleSelection(array: string[] | undefined, id: string): void {
    if (!array) return;
    const index = array.indexOf(id);
    index > -1 ? array.splice(index, 1) : array.push(id);
  }

  isSelected(array: string[] | undefined, id: string): boolean {
    return array?.includes(id) ?? false;
  }

  // Lista de UFs permitidas
  readonly ufsPermitidas: string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  formatUf(): void {
    if (this.formContact.uf) {
      // Converte para letras maiúsculas automaticamente
      const ufMaiuscula = this.formContact.uf.toUpperCase();

      // Verifica se a sigla digitada faz parte da lista permitida
      if (this.ufsPermitidas.includes(ufMaiuscula)) {
        this.formContact.uf = ufMaiuscula;
      } else if (ufMaiuscula.length === 2) {
        // Se digitar 2 letras inválidas, limpa o campo (ou ajuste conforme sua preferência)
        this.formContact.uf = '';
      } else {
        this.formContact.uf = ufMaiuscula;
      }
    }
  }

  saveContact(): void {
    if (!this.formContact.name || !this.formContact.email) {
      this.errorMessage = 'Nome e E-mail são obrigatórios.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const request$ = this.editingContactId
      ? this.contactsService.updateContact(this.editingContactId, this.formContact)
      : this.contactsService.createContact(this.formContact);

    request$.pipe(
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.closeModal();
        this.loadContacts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erro ao salvar contato.';
        this.cdr.detectChanges();
      },
    });
  }

  openDeleteModal(contact: Contact): void {
    this.contactToDelete = contact;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.contactToDelete = null;
    this.showDeleteModal = false;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.contactToDelete) return;

    this.isDeleting = true;
    this.contactsService.deleteContact(this.contactToDelete.id)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadContacts();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao excluir contato.';
        },
      });
  }

  openUnsubscribeModal(contact: Contact): void {
    if (contact.subscription?.status !== 'SUBSCRIBED') return;
    this.contactToUnsubscribe = contact;
    this.showUnsubscribeModal = true;
  }

  closeUnsubscribeModal(): void {
    this.showUnsubscribeModal = false;
    this.contactToUnsubscribe = null;
    this.isUnsubscribing = false;
  }

  confirmUnsubscribe(): void {
    if (!this.contactToUnsubscribe) return;

    this.isUnsubscribing = true;
    this.errorMessage = '';

    this.contactsService.unsubscribeContact(this.contactToUnsubscribe.id)
      .pipe(
        finalize(() => {
          this.isUnsubscribing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeUnsubscribeModal();
          this.loadContacts();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao descadastrar contato.';
        },
      });
  }

  openSubscriptionModal(contact: Contact): void {
    if (contact.subscription?.status === 'SUBSCRIBED') {
      this.contactToUnsubscribe = contact;
      this.showUnsubscribeModal = true;
      this.cdr.detectChanges();
    } else if (contact.subscription?.status === 'UNSUBSCRIBED') {
      this.contactToResubscribe = contact;
      this.showResubscribeModal = true;
      this.cdr.detectChanges();
    }
  }

  closeResubscribeModal(): void {
    this.showResubscribeModal = false;
    this.contactToResubscribe = null;
    this.isResubscribing = false;
  }

  confirmResubscribe(): void {
    if (!this.contactToResubscribe) return;

    this.isResubscribing = true;
    this.errorMessage = '';

    this.contactsService.resubscribeContact(this.contactToResubscribe.id)
      .pipe(
        finalize(() => {
          this.isResubscribing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeResubscribeModal();
          this.loadContacts();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao reativar inscrição.';
        },
      });
  }
}