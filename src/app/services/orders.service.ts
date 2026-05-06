import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private pb = new PocketBase('https://db.buckapi.site:8010');

  async createOrder(orderData: any) {
    return await this.pb.collection('orders').create(orderData);
  }

  getCurrentUser() {
    return this.pb.authStore.model;
  }

  isLoggedIn(): boolean {
    return this.pb.authStore.isValid;
  }
}