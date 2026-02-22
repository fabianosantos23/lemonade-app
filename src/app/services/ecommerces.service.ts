import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environment/environment';
import { Status } from '../core/types/common.types';

export interface Ecommerce {
  id: string;
  name: string;
  platform: string; // We will derive this from image or name
  description: string;
  icon: string;
  connected: boolean;
  status: Status;
  imageUrl?: string | null;
}

// Backend DTO interfaces
export interface EcommerceResponse {
  id: string;
  name: string;
  prompt: string;
  imageUrl: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEcommercePayload {
  name: string;
  prompt: string;
  status?: 'ACTIVE' | 'INACTIVE';
  image?: string;
}

export interface UpdateEcommercePayload {
  name?: string;
  prompt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  image?: string;
}

export interface UpdateEcommerceStatusPayload {
  status: `${Status}`;
}

@Injectable({
  providedIn: 'root'
})
export class EcommercesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.api}/ecommerces`;

  getEcommerces(): Observable<Ecommerce[]> {
    return this.http.get<{ data: EcommerceResponse[] }>(this.apiUrl).pipe(
      map(response => response.data.map(this.mapToFrontendModel))
    );
  }

  createEcommerce(data: CreateEcommercePayload): Observable<Ecommerce> {
    return this.http.post<{ data: EcommerceResponse }>(this.apiUrl, data).pipe(
      map(response => this.mapToFrontendModel(response.data))
    );
  }

  updateEcommerce(id: string, data: UpdateEcommercePayload): Observable<Ecommerce> {
    return this.http.put<{ data: EcommerceResponse }>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => this.mapToFrontendModel(response.data))
    );
  }

  updateStatus(id: string, status: `${Status}`): Observable<Ecommerce> {
    const payload: UpdateEcommerceStatusPayload = {
      status: status
    };

    return this.http.patch<{ data: EcommerceResponse }>(`${this.apiUrl}/${id}/status`, payload).pipe(
      map(response => this.mapToFrontendModel(response.data))
    );
  }

  uploadImage(id: string, file: File): Observable<HttpEvent<{ data: EcommerceResponse }>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ data: EcommerceResponse }>(`${this.apiUrl}/upload/${id}`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  deleteEcommerce(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private mapToFrontendModel(backend: EcommerceResponse): Ecommerce {
    const platform = backend.imageUrl || 'other'; // Assuming image holds platform key
    const connected = backend.status === Status.ACTIVE;
    
    let imageUrl = null;
    if (backend.imageUrl && backend.imageUrl.startsWith('uploads/')) {
       // Ensure no double slashes when joining
      const baseUrl = environment.uploadsUrl.endsWith('/') ? environment.uploadsUrl.slice(0, -1) : environment.uploadsUrl;
      imageUrl = `${baseUrl}/${backend.imageUrl}`;
    }

    return {
      id: backend.id,
      name: backend.name,
      platform: platform,
      description: backend.prompt,
      icon: '🌐',
      connected: connected,
      status: connected ? Status.ACTIVE : Status.INACTIVE,
      imageUrl: imageUrl
    };
  }
}
