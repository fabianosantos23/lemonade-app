
import { Role, UserSession } from './user.types';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user?: UserSession;
  access_token?: string;
  refresh_token?: string;
}

export interface CreateUserData {
  companyName: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  whatsapp?: string;
  password: string;
  acceptedTerms: boolean;
}

export type UserSignup = {
  id: string;
  name: string;
  email: string;
  role: `${Role}`;
}

export type CompanySignup = {
  id: string;
  name: string;
  cnpj: string;
}

export interface SignupResponse {
  user: UserSignup;
  company: CompanySignup;
  subscription: {
    id: string;
    status: string;
    isTrial: boolean;
  }
  companyRole: string;
  message: string;
}

export type PasswordResetResponse = {
  message: string;
  token: string;
}

export interface ActivateAccountPayload {
  token: string;
}

export interface ResendActivationPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password: string;
  passwordConfirmation: string;
  token: string;
}

export interface AuthMessageResponse {
  message: string;
}
