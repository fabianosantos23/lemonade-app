import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, PackageIcon, SparklesIcon, PlusIcon, FileTextIcon, ArrowRightIcon, ZapIcon, ShoppingCartIcon, ChartColumnIncreasingIcon, UploadIcon, MegaphoneIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private router = inject(Router);

  readonly PackageIcon = PackageIcon;
  readonly PlusIcon = PlusIcon;
  readonly FileTextIcon = FileTextIcon;
  readonly ArrowRightIcon = ArrowRightIcon;
  readonly ZapIcon = ZapIcon;
  readonly UploadIcon = UploadIcon;
  readonly MegaphoneIcon = MegaphoneIcon;
  readonly ClockIcon = ClockIcon;
  readonly CheckCircleIcon = CheckCircleIcon;
  readonly AlertCircleIcon = AlertCircleIcon;

  stats = [
    {
      label: 'Produtos Cadastrados',
      value: '124',
      change: '+12%',
      trend: 'up',
      color: 'bg-blue-500',
      icon: PackageIcon
    },
    {
      label: 'Gerações de IA',
      value: '1,234',
      change: '+8%',
      trend: 'up',
      color: 'bg-violet-500',
      icon: SparklesIcon
    },
    {
      label: 'Marketplaces Ativos',
      value: '3',
      change: '0',
      trend: 'neutral',
      color: 'bg-emerald-500',
      icon: ShoppingCartIcon
    },
    {
      label: 'Taxa de Aprovação',
      value: '98.5%',
      change: '+2%',
      trend: 'up',
      color: 'bg-amber-500',
      icon: ChartColumnIncreasingIcon
    }
  ];

  quickActions = [
    {
      id: 'new-product',
      label: 'Novo Produto',
      description: 'Criar do zero',
      icon: PlusIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'import',
      label: 'Importar',
      description: 'Planilha ou XML',
      icon: UploadIcon,
      color: 'bg-emerald-500'
    },
    {
      id: 'campaign',
      label: 'Nova Campanha',
      description: 'Criar anúncios',
      icon: MegaphoneIcon,
      color: 'bg-violet-500'
    }
  ];

  recentActivities = [
    {
      id: 1,
      title: 'Novo produto cadastrado',
      description: 'Nike Air Jordan 1 High OG foi adicionado ao catálogo',
      time: 'Há 2 minutos',
      icon: PackageIcon,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2,
      title: 'Importação concluída',
      description: '54 produtos importados do Mercado Livre com sucesso',
      time: 'Há 15 minutos',
      icon: CheckCircleIcon,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 3,
      title: 'Erro na sincronização',
      description: 'Falha ao atualizar estoque na Shopee',
      time: 'Há 1 hora',
      icon: AlertCircleIcon,
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 4,
      title: 'Geração de IA finalizada',
      description: 'Descrições geradas para 12 produtos',
      time: 'Há 2 horas',
      icon: SparklesIcon,
      color: 'bg-violet-100 text-violet-600'
    }
  ];

  handleQuickAction(action: string) {
    if (action === 'new-product') {
      this.router.navigate(['/private/products']);
    }
    console.log('Quick action:', action);
  }
}
