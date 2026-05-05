import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
cartItems: CartItem[] = [];
  subtotal = 0;

  constructor(public cartService: CartService) {
    this.cartService.items$.subscribe(items => {
      this.cartItems = items;
      this.subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    });
  }

  increment(id: string): void {
    this.cartService.increment(id);
  }

  decrement(id: string): void {
    this.cartService.decrement(id);
  }

  remove(id: string): void {
    this.cartService.removeItem(id);
  }
}
