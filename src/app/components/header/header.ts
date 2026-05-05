import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthPocketbaseService, StoreUser } from '../../services/auth-pocketbase.service';
import { Category } from '../../models/category.model';
import { CategoriesService } from '../../services/CategoriesService.service';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  user: StoreUser | null = null;
  showUserMenu = false;
  categories: Category[] = [];
  loadingCategories = true;
  showCategoriesMenu = false;
  private userSub?: Subscription;
  cartItems: CartItem[] = [];
  cartCount = 0;
  cartSubtotal = 0;
  showCart = false;

  constructor(
    public router: Router,
    public auth: AuthPocketbaseService,
    public categoriesService: CategoriesService,
    public cartService: CartService
  ) { }

  ngOnInit(): void {
    this.userSub = this.auth.currentUser$.subscribe(user => {
      this.user = user;
    });
     this.cartService.items$.subscribe(items => {
    this.cartItems = items;
    this.cartCount = items.reduce((total, item) => total + item.quantity, 0);
    this.cartSubtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  });

    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  async loadCategories(): Promise<void> {
    try {
      this.loadingCategories = true;

      const categories = await this.categoriesService.getCategories();

      console.log('📦 categorías header:', categories);

      this.categories = categories || [];
    } catch (error) {
      console.error('❌ error cargando categorías header:', error);
    } finally {
      this.loadingCategories = false;
    }
  }

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    this.showUserMenu = !this.showUserMenu;
  }

  async logout(): Promise<void> {
    this.showUserMenu = false;
    await this.auth.logout();
  }

  openCategoriesMenu(): void {
    this.showCategoriesMenu = true;
  }

  closeCategoriesMenu(): void {
    this.showCategoriesMenu = false;
  }

  toggleCategoriesMenu(event: Event): void {
    event.preventDefault();
    this.showCategoriesMenu = !this.showCategoriesMenu;
  }
  openCart(): void {
  this.showCart = true;
}

closeCart(): void {
  this.showCart = false;
}

incrementCartItem(id: string): void {
  this.cartService.increment(id);
}

decrementCartItem(id: string): void {
  this.cartService.decrement(id);
}

removeCartItem(id: string): void {
  this.cartService.removeItem(id);
}
}