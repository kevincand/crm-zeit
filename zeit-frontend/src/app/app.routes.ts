import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { LoginComponent } from './features/auth/login/login';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/contacts/contacts.component').then((m) => m.ContactsComponent),
      },
      {
        path: 'groups-interests',
        loadComponent: () => import('./features/groups-interests/groups-interests.component').then((m) => m.GroupsInterestsComponent),
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./features/campaigns/campaigns.component').then((m) => m.CampaignsComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'email-builder',
        loadComponent: () => import('./features/email-builder/email-builder.component').then((m) => m.EmailBuilderComponent),
      },
      {
        path: 'contacts/import',
        loadComponent: () => import('./features/leads/import-leads.component').then((m) => m.ImportLeadsComponent),
      },
    ],
  },
  {
    path: 'unsubscribe',
    loadComponent: () => import('./features/unsubscribe/unsubscribe.component').then((m) => m.UnsubscribeComponent),
  },
  { path: '**', redirectTo: 'login' },
];