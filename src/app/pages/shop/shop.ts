import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { Router } from '@angular/router';
import { ProductsService } from '../../services/ProductsService.service';
import { CommonModule } from '@angular/common';
import { CategoriesService } from '../../services/CategoriesService.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop implements OnInit, OnDestroy {
  products: Product[] = [];
  loadingProducts = false;
  categories: any[] = [];
  selectedCategory: string = 'all';
  filteredProducts: Product[] = [];

  constructor(
    public router: Router,
    public productsService: ProductsService,
    private cd: ChangeDetectorRef,
    public categoriesService: CategoriesService,
    public auth: AuthPocketbaseService,
    public wishlistService: WishlistService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.listenRealtimeProducts();
  }

  ngOnDestroy(): void {
    this.productsService.unsubscribeProducts();
  }
  async loadCategories(): Promise<void> {
  try {
    this.categories = await this.categoriesService.getCategories();
    this.cd.detectChanges();
  } catch (error) {
    console.error('Error cargando categorías:', error);
    this.categories = [];
  }
}
 /*  async loadProducts(): Promise<void> {
    this.loadingProducts = true;
    this.cd.detectChanges();

    try {
      this.products = await this.productsService.getProducts();
    } catch (error) {
      console.error('Error cargando productos en home:', error);
      this.products = [];
    } finally {
      this.loadingProducts = false;
      this.cd.detectChanges();
    }
  } */
async loadProducts(): Promise<void> {
  this.loadingProducts = true;
  this.cd.detectChanges();

  try {
    this.products = await this.productsService.getProducts();
    this.filteredProducts = this.products;
  } catch (error) {
    console.error('Error cargando productos en home:', error);
    this.products = [];
    this.filteredProducts = [];
  } finally {
    this.loadingProducts = false;
    this.cd.detectChanges();
  }
}
  async listenRealtimeProducts(): Promise<void> {
    try {
      await this.productsService.subscribeProducts(async (action, record) => {
        if (action === 'delete') {
          this.products = this.products.filter(product => product.id !== record.id);
          this.cd.detectChanges();
          return;
        }

        if (!record.id) return;

        const expandedProduct = await this.productsService.getProductById(record.id);

        const exists = this.products.some(product => product.id === expandedProduct.id);

        this.products = exists
          ? this.products.map(product =>
            product.id === expandedProduct.id ? expandedProduct : product
          )
          : [expandedProduct, ...this.products];

        this.cd.detectChanges();
      });
    } catch (error) {
      console.error('Error activando realtime de productos en home:', error);
    }
  }

  getFirstProductImage(product: any): string {
    const expandedImages = product.expand?.images;

    if (!expandedImages || expandedImages.length === 0) {
      return 'assets/images/1.jpeg';
    }

    const firstImage = Array.isArray(expandedImages)
      ? expandedImages[0]
      : expandedImages;

    const url = this.productsService.getImageRecordUrl(firstImage);

    return url || 'assets/images/1.jpeg';
  }

  goToProduct(product: Product): void {
    console.log('Producto clickeado:', product);
    console.log('ID producto:', product.id);

    if (!product.id) return;

    this.router.navigate(['/product-detail', product.id]).then(success => {
      console.log('¿Navegó?', success);
      console.log('URL actual:', this.router.url);
    }).catch(error => {
      console.error('Error navegando:', error);
    });
  }
  filterByCategory(categoryId: string): void {
  this.selectedCategory = categoryId;

  if (categoryId === 'all') {
    this.filteredProducts = this.products;
    return;
  }

  this.filteredProducts = this.products.filter((product: any) => {
    return this.getProductCategoryIds(product).includes(categoryId);
  });
}

getProductCategoryIds(product: any): string[] {
  if (!product) return [];

  if (Array.isArray(product.categories)) {
    return product.categories.filter(Boolean);
  }

  if (typeof product.categories === 'string') {
    return [product.categories];
  }

  const expandedCategories = product.expand?.categories;

  if (Array.isArray(expandedCategories)) {
    return expandedCategories.map((cat: any) => cat.id).filter(Boolean);
  }

  if (expandedCategories?.id) {
    return [expandedCategories.id];
  }

  return [];
}
toggleWishlist(product: any): void {
  const user = this.auth.getCurrentUser();

  if (!user) {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
    return;
  }

  const image = product.images?.length
    ? this.getFirstProductImage(product)
    : 'assets/images/no-image.png';

  this.wishlistService.toggleItem(product, image);
}

isFavorite(productId: string): boolean {
  return this.wishlistService.isFavorite(productId);
}
}
