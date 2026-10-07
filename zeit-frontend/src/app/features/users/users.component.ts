import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { UsersService, SystemUser, CreateUserDto } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  users: SystemUser[] = [];
  isLoading = false;
  isSaving = false;
  showModal = false;
  errorMessage = '';

  // Modal de Confirmação de Role
  showRoleModal = false;
  userToUpdateRole: SystemUser | null = null;
  targetRole: 'ADMIN' | 'MARKETING' | null = null;
  isUpdatingRole = false;

  // Modal de Confirmação de Status
  showStatusModal = false;
  userToUpdateStatus: SystemUser | null = null;
  isUpdatingStatus = false;

  currentUserEmail = '';

  // Modal de Senha
  showPasswordModal = false;
  userToUpdatePassword: SystemUser | null = null;
  newPasswordInput = '';
  isUpdatingPassword = false;

  newUser: CreateUserDto = this.getEmptyForm();

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => {
      this.currentUserEmail = u?.email || '';
    });
    this.loadUsers();
  }

  get canChangePassword(): boolean {
    return this.currentUserEmail === 'admin@zeit.com.br';
  }

  checkMaster(user: SystemUser): boolean {
    return user.email !== 'admin@zeit.com.br';
  }

  getEmptyForm(): CreateUserDto {
    return { name: '', email: '', password: '', role: 'MARKETING' };
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usersService
      .getUsers()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.users = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao carregar usuários.';
          this.cdr.detectChanges();
        },
      });
  }

  openCreateModal(): void {
    this.newUser = this.getEmptyForm();
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveUser(): void {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.errorMessage = 'Nome, e-mail e senha são obrigatórios.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.usersService
      .createUser(this.newUser)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao cadastrar usuário.';
        },
      });
  }

  // --- Controle de Modais de Confirmação ---

  openRoleModal(user: SystemUser): void {
    if(user.email == 'admin@zeit.com.br') return; 
    this.userToUpdateRole = user;
    this.targetRole = user.role === 'ADMIN' ? 'MARKETING' : 'ADMIN';
    this.showRoleModal = true;
    this.cdr.detectChanges();
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.userToUpdateRole = null;
    this.targetRole = null;
    this.isUpdatingRole = false;
  }

  confirmRoleChange(): void {
    if (!this.userToUpdateRole || !this.targetRole) return;

    this.isUpdatingRole = true;
    this.usersService
      .updateUser(this.userToUpdateRole.id, { role: this.targetRole })
      .pipe(
        finalize(() => {
          this.isUpdatingRole = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeRoleModal();
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao alterar permissão.';
        },
      });
  }

  openStatusModal(user: SystemUser): void {
    if(user.email == 'admin@zeit.com.br') return; 
    this.userToUpdateStatus = user;
    this.showStatusModal = true;
    this.cdr.detectChanges();
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.userToUpdateStatus = null;
    this.isUpdatingStatus = false;
  }

  confirmStatusChange(): void {
    if (!this.userToUpdateStatus) return;

    this.isUpdatingStatus = true;
    this.usersService
      .updateUser(this.userToUpdateStatus.id, { active: !this.userToUpdateStatus.active })
      .pipe(
        finalize(() => {
          this.isUpdatingStatus = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeStatusModal();
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao alterar status do usuário.';
        },
      });
  }

  openPasswordModal(user: SystemUser): void {
    this.userToUpdatePassword = user;
    this.newPasswordInput = '';
    this.errorMessage = '';
    this.showPasswordModal = true;
    this.cdr.detectChanges();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.userToUpdatePassword = null;
    this.newPasswordInput = '';
    this.isUpdatingPassword = false;
  }

  confirmPasswordChange(): void {
    if (!this.userToUpdatePassword || !this.newPasswordInput) {
      this.errorMessage = 'A nova senha é obrigatória.';
      return;
    }

    this.isUpdatingPassword = true;
    this.errorMessage = '';

    this.usersService
      .updatePassword(this.userToUpdatePassword.id, this.newPasswordInput)
      .pipe(
        finalize(() => {
          this.isUpdatingPassword = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closePasswordModal();
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao alterar a senha do usuário.';
        },
      });
  }
}