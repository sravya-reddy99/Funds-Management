import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

export type Fund = {
  id: string;
  name: string;
  strategies: string[];
  geographies: string[];
  currency: string;
  fundSize: number;
  vintage: number;
  managers: string[];
  description: string;
};

export type ListQuery = {
  name?: string;
  currency?: string;
  description?: string;
  strategy?: string;
  geography?: string;
  manager?: string;
  fundSizeMin?: number;
  fundSizeMax?: number;
  vintageMin?: number;
  vintageMax?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

@Injectable({ providedIn: "root" })
export class FundsService {
  private baseUrl = "http://localhost:3000/api";

  constructor(private http: HttpClient) {}

  list(query?: ListQuery): Observable<Fund[]> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        params = params.set(k, String(v));
      });
    }
    return this.http.get<Fund[]>(`${this.baseUrl}/funds`, { params });
  }

  get(id: string): Observable<Fund> {
    return this.http.get<Fund>(`${this.baseUrl}/funds/${id}`);
  }

  update(id: string, patch: Partial<Fund>): Observable<Fund> {
    return this.http.put<Fund>(`${this.baseUrl}/funds/${id}`, patch);
  }

  remove(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/funds/${id}`);
  }
}