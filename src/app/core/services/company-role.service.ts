import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { CompanyRole } from '../types/company.types';
import { Role } from '../types/user.types';

@Injectable({
  providedIn: 'root'
})
export class CompanyRoleService {
  private authService = inject(AuthService);

  hasCompanyRole(requiredRoles: CompanyRole[]): boolean {
    const user = this.authService.currentUser();
    
    // SuperAdmin bypasses company role checks
    if (user?.role === Role.SUPERADMIN) {
      return true;
    }

    const currentCompany = this.authService.currentCompany();
    
    // If no company selected or no role in company, deny if roles are required
    if (!currentCompany || !currentCompany.role) {
      return false;
    }

    return requiredRoles.includes(currentCompany.role as CompanyRole);
  }
}
