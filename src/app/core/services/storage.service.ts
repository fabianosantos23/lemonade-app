import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Request } from 'express';
import { REQUEST } from '../tokens/express.tokens';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Optional() @Inject(REQUEST) private request: Request
  ) {}

  /**
   * Obtém um cookie tanto no Browser quanto no Server (SSR)
   */
  getCookie(name: string): string | null {
    const key = `${environment.localStorageKey}${name}`;
    if (isPlatformBrowser(this.platformId)) {
      return this.getBrowserCookie(key);
    } else if (this.request) {
      return this.getServerCookie(key);
    }
    return null;
  }

  /**
   * Define um cookie (Apenas Browser)
   */
  setCookie(name: string, value: string, days: number = 30): void {
    if (isPlatformBrowser(this.platformId)) {
      const key = `${environment.localStorageKey}${name}`;
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      // Secure e SameSite são importantes para segurança
      document.cookie = `${key}=${value};${expires};path=/;SameSite=Lax;Secure`;
    }
  }

  /**
   * Remove um cookie (Apenas Browser)
   */
  deleteCookie(name: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const key = `${environment.localStorageKey}${name}`;
      document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Lax;Secure`;
    }
  }

  /**
   * Métodos para LocalStorage (Dados não críticos/persistência local)
   */
  setItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`${environment.localStorageKey}${key}`, value);
    }
  }

  getItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(`${environment.localStorageKey}${key}`);
    }
    return null;
  }

  removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(`${environment.localStorageKey}${key}`);
    }
  }

  clear(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
  }

  clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.clear();
    }
  }

  private getBrowserCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private getServerCookie(name: string): string | null {
    const cookieHeader = this.request.headers.cookie;
    if (!cookieHeader) return null;

    const nameEQ = name + "=";
    const ca = cookieHeader.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}
