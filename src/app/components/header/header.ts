import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthPocketbaseService, StoreUser } from '../../services/auth-pocketbase.service';
import { Category } from '../../models/category.model';
import { CategoriesService } from '../../services/CategoriesService.service';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from '../../services/cart.service';
import { WishlistService, WishlistItem } from '../../services/wishlist.service';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/ProductsService.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  user: StoreUser | null = null;
  showUserMenu = false;

  categories: Category[] = [];
  showCategoriesMenu = false;

  private userSub?: Subscription;
  private searchTimeout?: any;

  cartItems: CartItem[] = [];
  cartCount = 0;
  cartSubtotal = 0;
  showCart = false;

  wishlistItems: WishlistItem[] = [];
  wishlistCount = 0;

  searchTerm = '';
  searchResults: Product[] = [];
  searching = false;
  showSearchResults = false;
  parentCategories: Category[] = [];

  loadingCategories = false;
  constructor(
    public router: Router,
    public auth: AuthPocketbaseService,
    public categoriesService: CategoriesService,
    public cartService: CartService,
    public wishlistService: WishlistService,
    private productsService: ProductsService
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

    this.wishlistService.items$.subscribe(items => {
      this.wishlistItems = items;
      this.wishlistCount = items.length;
    });

    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  getSubcategories(parentId: string): Category[] {
    return this.categories.filter(cat => cat.parent === parentId);
  }
 async loadCategories(): Promise<void> {
  this.loadingCategories = true;

  try {
    const records = await this.categoriesService.getCategories();

    this.categories = records || [];

    this.parentCategories = this.categories
      .filter(cat => !cat.parent)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log('Todas las categorías header:', this.categories);
    console.log('Categorías padre header:', this.parentCategories);

  } catch (error) {
    console.error('Error cargando categorías en header:', error);
    this.categories = [];
    this.parentCategories = [];
  } finally {
    this.loadingCategories = false;
  }
}

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchProducts();
    }, 350);
  }

  async searchProducts(): Promise<void> {
    const term = this.searchTerm.trim();

    if (term.length < 2) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    try {
      this.searching = true;
      this.showSearchResults = true;

      this.searchResults = await this.productsService.searchProducts(term);
    } catch (error) {
      console.error('❌ error buscando productos:', error);
      this.searchResults = [];
    } finally {
      this.searching = false;
    }
  }

  goToProduct(product: Product): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showSearchResults = false;

    this.router.navigate(['/product', product.id]);
  }

  submitSearch(event: Event): void {
    event.preventDefault();

    const term = this.searchTerm.trim();

    if (!term) return;

    this.showSearchResults = false;

    this.router.navigate(['/shop'], {
      queryParams: {
        search: term
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }

  getProductImage(product: any): string {
    const images = product.expand?.images;

    if (Array.isArray(images) && images.length > 0) {
      return this.productsService.getImageRecordUrl(images[0]) || 'assets/images/no-image.png';
    }

    return 'assets/images/no-image.png';
  }

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    this.showUserMenu = !this.showUserMenu;
  }

  async logout(): Promise<void> {
    this.showUserMenu = false;
    await this.auth.logout();
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
  private categoriesMenuTimeout?: any;

  openCategoriesMenu(): void {
    this.cancelCloseCategoriesMenu();
    this.showCategoriesMenu = true;
  }

  scheduleCloseCategoriesMenu(): void {
    this.categoriesMenuTimeout = setTimeout(() => {
      this.showCategoriesMenu = false;
    }, 250);
  }

  cancelCloseCategoriesMenu(): void {
    if (this.categoriesMenuTimeout) {
      clearTimeout(this.categoriesMenuTimeout);
      this.categoriesMenuTimeout = null;
    }
  }

  closeCategoriesMenu(): void {
    this.cancelCloseCategoriesMenu();
    this.showCategoriesMenu = false;
  }
}