import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'activate',
    loadComponent: () => import('./activate-account/activate-account.component').then(m => m.ActivateAccountComponent)
  },
  {
    path: 'check',
    loadComponent: () => import('./initial-auth/initial-auth.component').then(m => m.InitialAuthComponent)
  },
  {
    path: 'select-company',
    loadComponent: () => import('./select-company/select-company.component').then(m => m.SelectCompanyComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
