import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environment/environment';
import { Store } from '../core/types/store.types';

export interface StoreResponse {
  data: Store[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.api}/stores`;

  getStores(params?: { page?: number; limit?: number; search?: string; status?: string }): Observable<Store[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<{ data: StoreResponse }>(this.apiUrl, { params: httpParams }).pipe(
      map(response => response.data.data)
    );
  }

  getStore(id: string): Observable<Store> {
    return this.http.get<{ data: Store }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createStore(payload: { name: string; description?: string; ecommerceIds?: string[]; imageUrl?: string }): Observable<Store> {
    return this.http.post<{ data: Store }>(this.apiUrl, payload).pipe(
      map(response => response.data)
    );
  }

  updateStore(id: string, payload: { name?: string; description?: string; ecommerceIds?: string[]; imageUrl?: string; status?: string }): Observable<Store> {
    return this.http.put<{ data: Store }>(`${this.apiUrl}/${id}`, payload).pipe(
      map(response => response.data)
    );
  }

  deleteStore(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload/${id}`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
