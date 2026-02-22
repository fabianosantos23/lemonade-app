import { Role } from './user.types';
import { CompanyRole } from './company.types';

export interface RoutePermissionConfig {
  requiredRoles?: Role[];
  requiredCompanyRoles?: CompanyRole[];
  requireSuperAdmin?: boolean;
}
