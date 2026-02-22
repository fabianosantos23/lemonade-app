
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { LoginCredentials, LoginResponse, CreateUserData, SignupResponse, ActivateAccountPayload, ResendActivationPayload, PasswordResetResponse, ResetPasswordPayload, AuthMessageResponse } from '../types/auth.types';
import { LoginCompany, UserSession } from '../types/user.types';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ApiSuccessResponse } from '../types/common.types';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  private apiUrl = environment.api;

  // State using Signals
  private readonly _currentUser = signal<UserSession | null>(null);
  private readonly _currentCompany = signal<LoginCompany | null>(null);

  // Computed values
  readonly currentUser = computed(() => this._currentUser());
  readonly currentCompany = computed(() => this._currentCompany());
  readonly isAuthenticated = computed(() => !!this._currentUser());

  login(credentials: LoginCredentials): Observable<ApiSuccessResponse<LoginResponse> | null> {
    return this.http.post<ApiSuccessResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, credentials, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.data?.user) {
          this._currentUser.set(res.data.user);

          if (res.data.user?.companies?.length === 1) {
            this._currentCompany.set(res.data.user?.companies[0]);
            this.storage.setCookie('companyId', res.data.user.companies[0].id);
          }
          
          if (res?.data?.access_token) {
            this.storage.setCookie('accessToken', res.data.access_token);
          }
          if (res?.data?.refresh_token) {
            this.storage.setCookie('refreshToken', res.data.refresh_token);
          }
        }
      })
    );
  }

  refreshToken(): Observable<ApiSuccessResponse<LoginResponse>> {
    const refreshToken = this.storage.getCookie('refreshToken');
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiSuccessResponse<LoginResponse>>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => {
        if (res?.data?.access_token) {
          this.storage.setCookie('accessToken', res.data.access_token);
        }
        if (res?.data?.refresh_token) {
          this.storage.setCookie('refreshToken', res.data.refresh_token);
        }
      })
    );
  }

  requestPasswordReset(email: string): Observable<ApiSuccessResponse<PasswordResetResponse> | null> {
    return this.http.post<ApiSuccessResponse<PasswordResetResponse>>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  signup(userData: CreateUserData): Observable<ApiSuccessResponse<SignupResponse> | null> {
    return this.http.post<ApiSuccessResponse<SignupResponse>>(`${this.apiUrl}/auth/register`, userData);
  }

  activateAccount(token: string): Observable<ApiSuccessResponse<{ message: string }>> {
    const payload: ActivateAccountPayload = { token };
    return this.http.post<ApiSuccessResponse<{ message: string }>>(`${this.apiUrl}/auth/activate`, payload);
  }

  resendActivation(email: string): Observable<ApiSuccessResponse<{ message: string }>> {
    const payload: ResendActivationPayload = { email };
    return this.http.post<ApiSuccessResponse<{ message: string }>>(`${this.apiUrl}/auth/resend-activation`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<ApiSuccessResponse<AuthMessageResponse>> {
    return this.http.post<ApiSuccessResponse<AuthMessageResponse>>(`${this.apiUrl}/auth/reset-password`, payload);
  }

  getProfile(): Observable<ApiSuccessResponse<{ user: UserSession}> | null> {
    return this.http.get<ApiSuccessResponse<{ user: UserSession}>>(`${this.apiUrl}/auth/me`).pipe(
      tap((res) => {
        if (!res?.data) {
          return;
        }

        const user = res.data.user;
        this._currentUser.set(user);
        const companyId = this.storage.getCookie('companyId');

        if (user?.companies?.length === 1 && !companyId) {
          this._currentCompany.set(user?.companies[0]);
          this.storage.setCookie('companyId', user?.companies[0].id);
        } else if (companyId) {
          const company = user.companies.find(c => c.id === companyId);
          if (company) {
              this._currentCompany.set(company);
          }
        }
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
      finalize(() => {
        this.performLogoutCleanup();
      })
    );
  }

  performLogoutCleanup() {
    this._currentUser.set(null);
    this._currentCompany.set(null);
    
    this.storage.deleteCookie('accessToken');
    this.storage.deleteCookie('refreshToken');
    this.storage.deleteCookie('companyId');
    
    // Limpeza completa do storage
    this.storage.clear();
    this.storage.clearSession();
    
    this.router.navigate(['/auth/login']);
  }

  selectCompany(company: LoginCompany) {
    this._currentCompany.set(company);
    this.storage.setCookie('companyId', company.id);
    // Optional: Persist selected company if needed, or handle redirection logic here if appropriate
  }
}
