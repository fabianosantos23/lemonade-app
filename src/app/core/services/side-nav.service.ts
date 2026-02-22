import { Injectable, computed, inject, signal } from '@angular/core';
import { 
  HouseIcon, 
  BoxIcon, 
  PackageIcon, 
  ShoppingCartIcon, 
  ChartColumnIncreasingIcon, 
  SettingsIcon, 
  UserIcon
} from 'lucide-angular';
import { AuthService } from './auth.service';
import { Role } from '../types/user.types';
import { CompanyRole } from '../types/company.types';
import { RoutePermissionConfig } from '../types/permission.types';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  permissions?: RoutePermissionConfig;
  hidden?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SideNavService {
  private authService = inject(AuthService);

  // Define navigation items with their permissions
  // This serves as the single source of truth for navigation and access control
  private readonly _navItems = signal<NavItem[]>([
    { 
      id: 'overview', 
      label: 'Visão Geral', 
      icon: HouseIcon, 
      route: '/dashboard',
      permissions: {} // Accessible to all authenticated users
    },
    { 
      id: "stores", 
      label: "Lojas", 
      icon: BoxIcon, 
      route: '/stores',
      permissions: {
        requiredRoles: [Role.REPRESENTATIVE, Role.MEMBER],
        // Example: Only Admin/Member can see stores, or maybe specific company roles
        requiredCompanyRoles: [CompanyRole.ADMIN, CompanyRole.SUPERVISOR, CompanyRole.EMPLOYEE]
      }
    },
    { 
      id: 'products', 
      label: 'Produtos', 
      icon: PackageIcon, 
      route: '/products',
      permissions: {
        requiredRoles: [Role.REPRESENTATIVE, Role.MEMBER]
      }
    },
    { 
      id: 'ecommerces', 
      label: 'Marketplaces', 
      icon: ShoppingCartIcon, 
      route: '/marketplaces',
      permissions: {
        requiredRoles: [Role.REPRESENTATIVE, Role.MEMBER]
      }
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: ChartColumnIncreasingIcon, 
      route: '/analytics',
      permissions: {
        requiredRoles: [Role.REPRESENTATIVE], // Example: Restricted to Admin
        requiredCompanyRoles: [CompanyRole.ADMIN, CompanyRole.SUPERVISOR]
      }
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: UserIcon,
      route: '/users',
      permissions: {
        requiredCompanyRoles: [CompanyRole.ADMIN]
      }
    },
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: SettingsIcon, 
      route: '/settings',
      permissions: {} // Accessible to all
    },
  ]);

  // Computed signal that filters items based on current user permissions
  readonly visibleMenuItems = computed(() => {
    const items = this._navItems();
    return items.filter(item => !item.hidden && this.checkPermission(item));
  });

  /**
   * Check if the current user has permission for a specific item/route
   */
  private checkPermission(item: NavItem): boolean {
    // If no permissions defined, it's public (for authenticated users)
    if (!item.permissions) return true;
    
    // Super Admin bypass
    // Note: We'll delegate the actual logic to helper methods to keep it clean
    // But since we need to filter inside the computed, we implement the logic here
    // referencing the auth service data.
    
    const user = this.authService.currentUser();
    if (!user) return false;

    // Super Admin check
    if (user.role === Role.SUPERADMIN) return true;

    const config = item.permissions;

    // Explicit Super Admin requirement
    if (config.requireSuperAdmin) return false;

    // Global Role check
    if (config.requiredRoles && config.requiredRoles.length > 0) {
      if (!user.role || !config.requiredRoles.includes(user.role as Role)) {
        return false;
      }
    }

    // Company Role check
    // We need the current company role. 
    // The user object has 'companies', but we need the role in the *current* company context.
    // However, for sidebar filtering, usually we check against the currently selected company.
    const currentCompany = this.authService.currentCompany();
    
    if (config.requiredCompanyRoles && config.requiredCompanyRoles.length > 0) {
      if (!currentCompany) return false; // Must be in a company context
      
      // Find user's role in the current company
      // Note: UserSession might not have companyRole directly if it's not enriched yet.
      // But based on previous context, user.companies has the list.
      const companyRel = user.companies.find(c => c.id === currentCompany.id);
      if (!companyRel || !companyRel.role || !config.requiredCompanyRoles.includes(companyRel.role as CompanyRole)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns the permission configuration for a given route URL.
   * Used by AuthGuard.
   */
  getPermissionsForRoute(url: string): RoutePermissionConfig | null {
    // Simple matching logic. 
    // If we have dynamic routes (e.g. /stores/123), we need smarter matching.
    // For now, we assume the nav items cover the base paths.
    
    // Normalize url (remove query params, etc)
    const path = url.split('?')[0];
    
    // Find the item that best matches the start of the path
    // Sort by length desc to match most specific first
    const items = [...this._navItems()].sort((a, b) => b.route.length - a.route.length);
    
    const match = items.find(item => path.startsWith(item.route));
    
    return match ? match.permissions || {} : null;
  }
}
