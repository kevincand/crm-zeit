import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth';
import { StatsService, OverviewStats } from '../../core/services/stats';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  stats: OverviewStats | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => (this.user = u));
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.statsService.getOverview().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        if(err.status == 401) this.logout();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}