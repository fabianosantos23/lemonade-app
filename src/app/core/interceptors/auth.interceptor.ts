import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Inject, inject, REQUEST_CONTEXT } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiSuccessResponse } from '../types/common.types';
import { LoginResponse } from '../types/auth.types';

/**
 * Lista de rotas públicas que não requerem token de autenticação.
 * O interceptor verificará se a URL da requisição contém algum destes caminhos.
 */
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/register',
  '/auth/activate',
  '/auth/resend-activation'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const storageService = inject(StorageService);

  // Verifica se a rota atual é pública
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  let newReq = req;

  // Só adiciona headers de autenticação se NÃO for uma rota pública
  if (!isPublicEndpoint) {
    const token = storageService.getCookie('accessToken');
    const companyId = storageService.getCookie('companyId');
    let headers = req.headers;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (companyId) {
      headers = headers.set('x-company-id', companyId);
    }

    newReq = req.clone({ headers });
  }

  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ignora erro 401 se for em rotas públicas ou no logout para evitar loops
      if (error.status === 401 && !isPublicEndpoint && !req.url.includes('/auth/logout')) {
        return authService.refreshToken().pipe(
          switchMap((response: ApiSuccessResponse<LoginResponse>) => {
            const newToken = response.data?.access_token || storageService.getCookie('accessToken');
            const newAuthReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`)
            });
            return next(newAuthReq);
          }),
          catchError((refreshError: unknown) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
