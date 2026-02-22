import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

export const privateRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { title: 'Dashboard', subtitle: 'Bem-vindo ao seu painel de controle' }
  },
  {
    path: 'stores',
    loadComponent: () => import('./pages/stores/stores.component').then(m => m.StoresComponent),
    canActivate: [authGuard],
    data: { title: 'Lojas', subtitle: 'Gerencie suas lojas integradas' }
  },
  {
    path: 'marketplaces',
    loadComponent: () => import('./pages/ecommerces/ecommerces.component').then(m => m.EcommercesComponent),
    canActivate: [authGuard],
    data: { title: 'Marketplaces', subtitle: 'Configurações de integração de e-commerce' }
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsPageComponent),
    canActivate: [authGuard],
    data: { title: 'Produtos', subtitle: 'Gerencie seu catálogo e otimize suas descrições com IA' }
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    canActivate: [authGuard],
    data: { title: 'Detalhes do Produto', subtitle: 'Visualize e gerencie as informações do produto', showBack: true }
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard],
    data: { title: 'Usuários', subtitle: 'Gestão de usuários e permissões' }
  }
];
