import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface OrderEmailProduct {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  image?: string;
}

export interface PurchaseEmailDto {
  toEmail: string;
  toName: string;
  templateId: number;
  params: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: string;
    subtotal: string;
    shipping: string;
    paymentMethod: string;
    address: string;
    phone: string;
    note?: string;
    products: OrderEmailProduct[];
    productsHtml: string;
  };
}

@Injectable({ providedIn: 'root' })
export class EmailNotificationService {
  private http = inject(HttpClient);
  private base = 'https://db.buckapi.site:5005';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  sendCustomerPurchase(dto: PurchaseEmailDto) {
    return this.http.post(
      `${this.base}/email/CompraCliente`,
      dto,
      { headers: this.headers }
    );
  }

  sendAdminPurchase(dto: PurchaseEmailDto) {
    return this.http.post(
      `${this.base}/email/CompraAdmin`,
      dto,
      { headers: this.headers }
    );
  }
}