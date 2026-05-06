import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface OrderEmailPayload {
  toEmail: string;
  toName: string;
  templateId: number;
  subject?: string;
  params: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    items: any[];
    subtotal: number;
    shipping: number;
    total: number;
    isGuest: boolean;
    loginMessage?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EmailNotificationService {
  private baseUrl = 'https://TU-BACKEND.com';
  private defaultTimeoutMs = 15000;

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  sendOrderToClient(dto: OrderEmailPayload): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/api/order-client`, dto, this.httpOptions)
      .pipe(
        timeout(this.defaultTimeoutMs),
        catchError((error) => {
          console.error('Error enviando pedido al cliente:', error);
          return of({
            success: false,
            message: error?.error?.message || 'Error enviando pedido al cliente'
          });
        })
      );
  }

  sendOrderToAdmin(dto: OrderEmailPayload): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/api/order-admin`, dto, this.httpOptions)
      .pipe(
        timeout(this.defaultTimeoutMs),
        catchError((error) => {
          console.error('Error enviando pedido al admin:', error);
          return of({
            success: false,
            message: error?.error?.message || 'Error enviando pedido al admin'
          });
        })
      );
  }
}