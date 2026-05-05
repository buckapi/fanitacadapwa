import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  stock?: number;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private storageKey = 'fanaticada_wishlist';

  private itemsSubject = new BehaviorSubject<WishlistItem[]>(this.getStoredItems());
  items$ = this.itemsSubject.asObservable();

  addItem(product: any, image?: string): void {
    const items = [...this.itemsSubject.value];

    const exists = items.some(item => item.id === product.id);

    if (!exists) {
      items.push({
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        image,
        category: product.category,
        stock: product.stock,
      });

      this.save(items);
    }
  }

  removeItem(id: string): void {
    this.save(this.itemsSubject.value.filter(item => item.id !== id));
  }

  toggleItem(product: any, image?: string): void {
    if (this.isFavorite(product.id)) {
      this.removeItem(product.id);
    } else {
      this.addItem(product, image);
    }
  }

  isFavorite(id: string): boolean {
    return this.itemsSubject.value.some(item => item.id === id);
  }

  getCount(): number {
    return this.itemsSubject.value.length;
  }

  clear(): void {
    this.save([]);
  }

  private save(items: WishlistItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  private getStoredItems(): WishlistItem[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }
}