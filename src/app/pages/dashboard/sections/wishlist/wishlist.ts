import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService, WishlistItem } from '../../../../services/wishlist.service';
import { CartService } from '../../../../services/cart.service';


@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist {
wishlistItems: WishlistItem[] = [];

  constructor(
    public wishlistService: WishlistService,
    private cartService: CartService
  ) {
    this.wishlistService.items$.subscribe(items => {
      this.wishlistItems = items;
    });
  }

  remove(id: string): void {
    this.wishlistService.removeItem(id);
  }

  moveToCart(item: WishlistItem): void {
    this.cartService.addItem(item, 1, item.image);
    this.wishlistService.removeItem(item.id);
  }

  addToCart(item: WishlistItem): void {
    this.cartService.addItem(item, 1, item.image);
  }

  clearWishlist(): void {
    this.wishlistService.clear();
  }
}
