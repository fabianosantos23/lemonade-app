import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import { Role } from '../types/user.types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: string;
  deletedAt?: string;
}

export interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface PaginatedUsersResponse {
  data: User[];
  page: number;
  total: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.api}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10): Observable<PaginatedUsersResponse> {
    return this.http.get<PaginatedUsersResponse>(this.apiUrl, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  createUser(user: Partial<User>): Observable<{ data: User }> {
    return this.http.post<{ data: User }>(this.apiUrl, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<{ data: User }> {
    return this.http.patch<{ data: User }>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<{ data: User }> {
    return this.http.delete<{ data: User }>(`${this.apiUrl}/${id}`);
  }

  restoreUser(id: string): Observable<{ data: User }> {
    return this.http.post<{ data: User }>(`${this.apiUrl}/${id}/restore`, {});
  }
}
