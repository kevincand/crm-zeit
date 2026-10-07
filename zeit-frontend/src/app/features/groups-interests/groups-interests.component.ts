import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { GroupsInterestsService, Group, Interest } from '../../core/services/groups-interests.service';

@Component({
  selector: 'app-groups-interests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups-interests.component.html',
})
export class GroupsInterestsComponent implements OnInit {
  groups: Group[] = [];
  interests: Interest[] = [];

  isLoadingGroups = false;
  isLoadingInterests = false;
  isSaving = false;

  showGroupModal = false;
  showInterestModal = false;
  errorMessage = '';

  newGroup = { name: '', description: '' };
  newInterest = { name: '', description: '' };

  constructor(
    private service: GroupsInterestsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadInterests();
  }

  loadGroups(): void {
    this.isLoadingGroups = true;
    this.service.getGroups()
      .pipe(
        finalize(() => {
          this.isLoadingGroups = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.groups = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao carregar grupos.';
          this.cdr.detectChanges();
        },
      });
  }

  loadInterests(): void {
    this.isLoadingInterests = true;
    this.service.getInterests()
      .pipe(
        finalize(() => {
          this.isLoadingInterests = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.interests = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao carregar interesses.';
          this.cdr.detectChanges();
        },
      });
  }

  openGroupModal(): void {
    this.newGroup = { name: '', description: '' };
    this.errorMessage = '';
    this.showGroupModal = true;
  }

  openInterestModal(): void {
    this.newInterest = { name: '', description: '' };
    this.errorMessage = '';
    this.showInterestModal = true;
  }

  saveGroup(): void {
    if (!this.newGroup.name) {
      this.errorMessage = 'O nome do grupo é obrigatório.';
      return;
    }

    this.isSaving = true;
    this.service.createGroup(this.newGroup)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showGroupModal = false;
          this.loadGroups();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao criar grupo.';
          this.cdr.detectChanges();
        },
      });
  }

  saveInterest(): void {
    if (!this.newInterest.name) {
      this.errorMessage = 'O nome do interesse é obrigatório.';
      return;
    }

    this.isSaving = true;
    this.service.createInterest(this.newInterest)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showInterestModal = false;
          this.loadInterests();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao criar interesse.';
          this.cdr.detectChanges();
        },
      });
  }
}