import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../environment/environment';
import { 
  Product, 
  ProductStats, 
  ProductStatus, 
  CreateProductDto, 
  UpdateProductDto,
  GenerateDescriptionBatchDto,
  RegenerateDescriptionDto,
  ProductHistoryItem,
  ProductQuickStats,
  GenerateBatchResponse,
  PaginatedProducts,
  ImprovedDescriptionStatus,
} from '../core/types/product.types';
import { ApiSuccessResponse } from '../core/types/common.types';

export function mapProductImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) {
    return undefined;
  }

  const lower = imageUrl.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return imageUrl;
  }

  const baseUrl = environment.uploadsUrl.endsWith('/')
    ? environment.uploadsUrl.slice(0, -1)
    : environment.uploadsUrl;
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;

  return `${baseUrl}/${normalizedPath}`;
}

export function normalizeProductImageUrlForBackend(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) {
    return undefined;
  }

  const baseUrl = environment.uploadsUrl.endsWith('/')
    ? environment.uploadsUrl.slice(0, -1)
    : environment.uploadsUrl;

  const lower = imageUrl.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    if (imageUrl.startsWith(baseUrl)) {
      const relative = imageUrl.slice(baseUrl.length);
      return relative.startsWith('/') ? relative.slice(1) : relative;
    }
    return imageUrl;
  }

  return imageUrl;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.api}/products`;

  // Signals for state management
  private productsState = signal<Product[]>([]);
  private statsState = signal<ProductStats>({ total: 0, basic: 0, enhanced: 0, published: 0 });

  products = computed(() => this.productsState());
  stats = computed(() => this.statsState());

  findAll(params: { page?: number; limit?: number; search?: string; storeId?: string }): Observable<PaginatedProducts> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedProducts>(this.apiUrl, { params: httpParams }).pipe(
      map(response => {
        const mapped = response.data.map(p => this.mapToFrontendModel(p));
        return { ...response, data: mapped };
      }),
      tap(response => {
        this.productsState.set(response.data);
        this.updateStats(response.data);
      })
    );
  }

  findById(id: string): Observable<Product> {
    return this.http.get<ApiSuccessResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(product => this.mapToFrontendModel(product.data))
    );
  }

  create(product: CreateProductDto & { imageUrl?: string | null }): Observable<Product> {
    const payload = this.normalizeProductPayload(product);
    return this.http.post<Product>(this.apiUrl, payload).pipe(
      map(p => this.mapToFrontendModel(p)),
      tap(() => this.refresh())
    );
  }

  update(id: string, product: UpdateProductDto & { imageUrl?: string | null }): Observable<Product> {
    const payload = this.normalizeProductPayload(product);
    return this.http.put<ApiSuccessResponse<Product>>(`${this.apiUrl}/${id}`, payload).pipe(
      map(p => this.mapToFrontendModel(p.data)),
      tap(() => this.refresh())
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refresh())
    );
  }

  uploadImage(id: string, file: File): Observable<ApiSuccessResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiSuccessResponse<{ imageUrl: string }>>(`${this.apiUrl}/upload/${id}`, formData).pipe(
      tap(({ data: { imageUrl } }) => {
        const mappedUrl = mapProductImageUrl(imageUrl);
        this.productsState.update(products => 
          products.map(p => p.id === id ? { ...p, imageUrl: mappedUrl } : p)
        );
      })
    );
  }

  generateBatch(id: string, dto: GenerateDescriptionBatchDto): Observable<ApiSuccessResponse<GenerateBatchResponse[]>> {
    return this.http.post<ApiSuccessResponse<GenerateBatchResponse[]>>(
      `${this.apiUrl}/descriptions/${id}/batch`,
      dto,
    );
  }

  regenerateDescription(id: string, dto: RegenerateDescriptionDto): Observable<ApiSuccessResponse<GenerateBatchResponse>> {
    return this.http.post<ApiSuccessResponse<GenerateBatchResponse>>(
      `${this.apiUrl}/descriptions/${id}/regenerate`,
      dto,
    );
  }

  updateDescriptionStatus(id: string, status: ImprovedDescriptionStatus): Observable<GenerateBatchResponse> {
    return this.http
      .patch<ApiSuccessResponse<GenerateBatchResponse>>(
        `${this.apiUrl}/descriptions/${id}/status`,
        { status },
      )
      .pipe(map(res => res.data));
  }

  updateDescriptionResult(id: string, result: string): Observable<GenerateBatchResponse> {
    return this.http
      .patch<ApiSuccessResponse<GenerateBatchResponse>>(
        `${this.apiUrl}/descriptions/${id}/result`,
        { result },
      )
      .pipe(map(res => res.data));
  }

  listDescriptionsByProduct(productId: string): Observable<GenerateBatchResponse[]> {
    return this.http
      .get<ApiSuccessResponse<GenerateBatchResponse[]>>(`${this.apiUrl}/descriptions/${productId}`)
      .pipe(map(res => res.data));
  }

  getHistory(productId: string): Observable<ProductHistoryItem[]> {
    return this.http
      .get<ApiSuccessResponse<ProductHistoryItem[]>>(`${this.apiUrl}/history/${productId}`)
      .pipe(map(res => res.data));
  }

  updateStatus(id: string, status: ProductStatus): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      map(product => this.mapToFrontendModel(product))
    );
  }

  getStats(id: string) {
    return this.http
      .get<ApiSuccessResponse<ProductQuickStats>>(`${this.apiUrl}/${id}/stats`)
      .pipe(map(res => res.data));
  }

  private updateStats(products: Product[]) {
    const stats: ProductStats = {
      total: products.length,
      basic: products.filter(p => p.status === ProductStatus.ACTIVE).length,
      enhanced: products.filter(p => p.status === ProductStatus.ENHANCED).length,
      published: products.filter(p => p.status === ProductStatus.PUBLISHED).length
    };
    this.statsState.set(stats);
  }

  private refresh() {
    this.findAll({ page: 1, limit: 100 }).subscribe();
  }

  // URL convention: backend stores relative paths; frontend uses full URLs with uploadsUrl
  private mapToFrontendModel(backend: Product): Product {
    const imageUrl = mapProductImageUrl(backend.imageUrl);
    return {
      ...backend,
      imageUrl
    };
  }

  private normalizeProductPayload<T extends { imageUrl?: string | null }>(payload: T): T {
    const imageUrl = payload.imageUrl;
    if (!imageUrl) {
      return payload;
    }

    const normalized = normalizeProductImageUrlForBackend(imageUrl) ?? undefined;
    return { ...payload, imageUrl: normalized } as T;
  }
}
