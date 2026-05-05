import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthPocketbaseService } from '../../../../services/auth-pocketbase.service';
import { WishlistService } from '../../../../services/wishlist.service';
import { CartService } from '../../../../services/cart.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
 user: any = null;
  wishlistCount = 0;
  cartCount = 0;

  constructor(
    private auth: AuthPocketbaseService,
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {
    this.user = this.auth.getCurrentUser();

    this.wishlistService.items$.subscribe(items => {
      this.wishlistCount = items.length;
    });

    this.cartService.items$.subscribe(items => {
      this.cartCount = items.reduce((total, item) => total + item.quantity, 0);
    });
  }
}
