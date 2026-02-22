
import { Routes } from '@angular/router';
import { Private } from './private/private';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'access-denied',
    loadComponent: () => import('./public/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./public/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./private/private.routes').then(m => m.privateRoutes),
    component: Private,
    canActivate: [authGuard] // Base auth check for all private routes
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
];
