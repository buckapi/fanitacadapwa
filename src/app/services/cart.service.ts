import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

/* export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock?: number;
  size?: string;
  color?: string;
} */
export interface CartItem {
  id: string;
  productId: string;
  variantKey?: string;

  name: string;
  price: number;
  image?: string;

  quantity: number;
  stock?: number;

  size?: string;
  color?: string;
  colorHex?: string;
}
@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'fanaticada_cart';

  private itemsSubject = new BehaviorSubject<CartItem[]>(this.getStoredCart());
  items$ = this.itemsSubject.asObservable();

  private itemAddedSubject = new Subject<CartItem>();
  itemAdded$ = this.itemAddedSubject.asObservable();

 /*  addItem(product: any, quantity = 1, image?: string): void {
    const items = [...this.itemsSubject.value];

    const index = items.findIndex(item => item.id === product.id);

    if (index >= 0) {
      items[index] = {
        ...items[index],
        quantity: items[index].quantity + quantity,
      };

      this.save(items);
      this.itemAddedSubject.next(items[index]);
      return;
    }

    const newItem: CartItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image,
      quantity,
      stock: product.stock,
      size: product.size,
      color: product.color,
    };

    items.push(newItem);

    this.save(items);
    this.itemAddedSubject.next(newItem);
  } */
  addItem(product: any, quantity = 1, image?: string): void {
  const items = [...this.itemsSubject.value];

  const variant = product.selectedVariant;

  if (!variant && product.variants?.length > 0) {
    console.warn('Producto con variantes sin variante seleccionada');
    return;
  }

  const variantKey = variant
    ? `${variant.size}-${variant.colorName}-${variant.colorHex}`
    : 'default';

  const cartId = `${product.id}-${variantKey}`;

  const stock = Number(variant?.stock ?? product.stock ?? 0);

  const index = items.findIndex(item => item.id === cartId);

  if (index >= 0) {
    const newQuantity = items[index].quantity + quantity;
    items[index].quantity = Math.min(newQuantity, stock);

    this.save(items);
    this.itemAddedSubject.next(items[index]);
    return;
  }

  const newItem: CartItem = {
    id: cartId,
    productId: product.id,
    variantKey,

    name: product.name,
    price: Number(product.price || 0),
    image,

    quantity: Math.min(quantity, stock),
    stock,

    size: variant?.size,
    color: variant?.colorName,
    colorHex: variant?.colorHex
  };

  items.push(newItem);

  this.save(items);
  this.itemAddedSubject.next(newItem);
}

/*   increment(id: string): void {
    const items = this.itemsSubject.value.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );

    this.save(items);
  } */

  increment(id: string): void {
  const items = [...this.itemsSubject.value];

  const index = items.findIndex(item => item.id === id);
  if (index === -1) return;

  const stock = Number(items[index].stock || 0);

  if (items[index].quantity < stock) {
    items[index].quantity++;
    this.save(items);
  }
}

  decrement(id: string): void {
  const items = [...this.itemsSubject.value];

  const index = items.findIndex(item => item.id === id);
  if (index === -1) return;

  items[index].quantity--;

  const updatedItems = items.filter(item => item.quantity > 0);

  this.save(updatedItems);
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