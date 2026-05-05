import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock?: number;
  size?: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'fanaticada_cart';

  private itemsSubject = new BehaviorSubject<CartItem[]>(this.getStoredCart());
  items$ = this.itemsSubject.asObservable();

  addItem(product: any, quantity = 1, image?: string): void {
    const items = [...this.itemsSubject.value];

    const index = items.findIndex(item => item.id === product.id);

    if (index >= 0) {
      items[index].quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        image,
        quantity,
        stock: product.stock,
      });
    }

    this.save(items);
  }

  increment(id: string): void {
    const items = this.itemsSubject.value.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );

    this.save(items);
  }

  decrement(id: string): void {
    const items = this.itemsSubject.value
      .map(item =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter(item => item.quantity > 0);

    this.save(items);
  }

  removeItem(id: string): void {
    this.save(this.itemsSubject.value.filter(item => item.id !== id));
  }

  clear(): void {
    this.save([]);
  }

  getCount(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  getSubtotal(): number {
    return this.itemsSubject.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  private save(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  private getStoredCart(): CartItem[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }
}