import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChildFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';
import { CompanyRoleService } from '../services/company-role.service';
import { StorageService } from '../services/storage.service';
import { SideNavService } from '../services/side-nav.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const companyRoleService = inject(CompanyRoleService);
  const storageService = inject(StorageService);
  const sideNavService = inject(SideNavService);
  const router = inject(Router);

  const checkPermissions = (): boolean | UrlTree => {
    // 1. Authentication Validation (Double check)
    if (!authService.isAuthenticated()) {
      console.warn(`[AuthGuard] Access denied to ${state.url}: User not authenticated`);
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }

    // Get permissions from SideNavService instead of route data
    const permissionConfig = sideNavService.getPermissionsForRoute(state.url);

    // If no config found or empty, allow access (or handle otherwise if needed)
    if (!permissionConfig) {
      return true;
    }
    
    // 4. Super Admin Check (Global bypass)
    if (roleService.isSuperAdmin()) {
      return true;
    }

    // If explicit Super Admin required
    if (permissionConfig.requireSuperAdmin) {
      console.warn(`[AuthGuard] Access denied to ${state.url}: Requires SUPERADMIN`);
      return router.createUrlTree(['/access-denied']); 
    }

    // 2. Global Role Validation
    if (permissionConfig.requiredRoles && permissionConfig.requiredRoles.length > 0) {
      if (!roleService.hasRole(permissionConfig.requiredRoles)) {
        console.warn(`[AuthGuard] Access denied to ${state.url}: Missing required global role. Required: ${JSON.stringify(permissionConfig.requiredRoles)}`);
        return router.createUrlTree(['/access-denied']);
      }
    }

    // 3. Company Role Validation
    if (permissionConfig.requiredCompanyRoles && permissionConfig.requiredCompanyRoles.length > 0) {
      if (!companyRoleService.hasCompanyRole(permissionConfig.requiredCompanyRoles)) {
        console.warn(`[AuthGuard] Access denied to ${state.url}: Missing required company role. Required: ${JSON.stringify(permissionConfig.requiredCompanyRoles)}`);
        return router.createUrlTree(['/access-denied']);
      }
    }

    return true;
  };

  // Scenario 1: User is already authenticated
  if (authService.isAuthenticated()) {
    return checkPermissions();
  }

  // Scenario 2: User has token but state is lost (refresh)
  const token = storageService.getCookie('accessToken');
  if (token) {
    return authService.getProfile().pipe(
      map(() => {
        return checkPermissions();
      }),
      catchError((err) => {
        console.warn(`[AuthGuard] Token validation failed:`, err);
        return of(router.createUrlTree(['/auth/check'], { queryParams: { returnUrl: state.url } }));
      })
    );
  }

  // Scenario 3: No token
  console.warn(`[AuthGuard] Access denied to ${state.url}: No token found`);
  return router.createUrlTree(['/auth/check'], { queryParams: { returnUrl: state.url } });
};

export const authChildGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return authGuard(route, state);
}
