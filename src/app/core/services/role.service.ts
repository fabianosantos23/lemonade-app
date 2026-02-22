import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Role } from '../types/user.types';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private authService = inject(AuthService);

  hasRole(requiredRoles: Role[]): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }

    const user = this.authService.currentUser();
    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role as Role);
  }

  isSuperAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.role === Role.SUPERADMIN;
  }
}
