import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private apiUrl = 'https://db.buckapi.site:4242/payments';
  /* private apiUrl = 'http://localhost:4242/payments'; */
  constructor(private http: HttpClient) {}

  createPayment(payload: {
    amount: number;
    userId?: string;
    orderId: string;
    customerEmail: string;
    customerName: string;
  }) {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/create`, payload)
    );
  }

  redirectToTransbank(url: string, token: string): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }
}