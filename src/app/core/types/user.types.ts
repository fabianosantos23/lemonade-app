import { Status } from "./common.types";
import { CompanyRole } from "./company.types";

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  REPRESENTATIVE = 'REPRESENTATIVE',
  MEMBER = 'MEMBER',
}

export type LoginCompany = {
  id: string;
  name: string;
  cnpj?: string;
  status: `${Status}`;
  role?: `${CompanyRole}`;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role?: `${Role}`;
  companies: LoginCompany[];
}
