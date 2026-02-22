export enum CompanyRole {
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  whatsapp?: string;
  acceptedTerms: boolean;
  createdAt: string;
  updatedAt: string;
}
