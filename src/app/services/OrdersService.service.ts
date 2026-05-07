import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private pb = new PocketBase('https://db.buckapi.site:8010');

constructor() {
  this.pb.autoCancellation(false);
}

    createOrder(orderData: any) {
    return this.pb.collection('orders').create(orderData);
    }

  async getOrders(): Promise<Order[]> {
    return await this.pb.collection('orders').getFullList<Order>({
      sort: '-created',
    });
  }

  async getOrderById(id: string): Promise<Order> {
    return await this.pb.collection('orders').getOne<Order>(id);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return await this.pb.collection('orders').update<Order>(id, {
      status
    });
  }

  async deleteOrder(id: string): Promise<boolean> {
    await this.pb.collection('orders').delete(id);
    return true;
  }

  async subscribeOrders(callback: (action: string, record: Order) => void): Promise<void> {
    await this.pb.collection('orders').subscribe('*', (event) => {
      callback(event.action, event.record as Order);
    });
  }

  unsubscribeOrders(): void {
    this.pb.collection('orders').unsubscribe('*');
  }
  async getOrdersByUser(userId: string): Promise<Order[]> {

  const result = await this.pb.collection('orders').getList<Order>(1, 20, {
    sort: '-created',
    filter: `user = "${userId}"`,
  });

  return result.items;
}

async getOrdersByCustomerEmail(email: string): Promise<Order[]> {

  const result = await this.pb.collection('orders').getList<Order>(1, 20, {
    sort: '-created',
    filter: `customerEmail = "${email}"`,
  });

  return result.items;
}

}