import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/ProductsService.service';
import { CommonModule } from '@angular/common';
import { CategoriesService } from '../../services/CategoriesService.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { Category } from '../../models/category.model';
import { Title, Meta } from '@angular/platform-browser';

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
  parentCategories: Category[] = [];
  selectedSubcategory: string = '';
  subcategories: Category[] = [];
  currentPage = 1;
itemsPerPage = 50;
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    public productsService: ProductsService,
    private cd: ChangeDetectorRef,
    public categoriesService: CategoriesService,
    public auth: AuthPocketbaseService,
    public wishlistService: WishlistService,
    private title: Title,
    private meta: Meta
  ) { }


  ngOnInit(): void {
  this.loadCategories();
  this.loadProducts();
  this.listenRealtimeProducts();

  this.route.queryParams.subscribe(params => {
    const category = params['category'] || 'all';
    const subcategory = params['subcategory'] || '';

    this.selectedCategory = category;
    this.selectedSubcategory = subcategory;

    this.applyFilters();
    this.cd.detectChanges();
  });

  this.title.setTitle('Camisetas y productos deportivos | Fanaticada.cl');

  this.meta.updateTag({
    name: 'description',
    content: 'Compra camisetas, ropa deportiva y accesorios originales en Fanaticada.cl.'
  });
}
get paginatedProducts(): Product[] {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;

  return this.filteredProducts.slice(start, end);
}

get totalPages(): number {
  return Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1;
}

get pages(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

goToPage(page: number): void {
  if (page < 1 || page > this.totalPages) return;

  this.currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  ngOnDestroy(): void {
    this.productsService.unsubscribeProducts();
  }
 async loadCategories(): Promise<void> {
  try {
    const records = await this.categoriesService.getCategories();

    this.categories = records;

    this.parentCategories = records
      .filter((cat: any) => !cat.parent)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    this.subcategories = records
      .filter((cat: any) => cat.parent)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    this.applyFilters();

    this.cd.detectChanges();
  } catch (error) {
    console.error('Error cargando categorías:', error);
    this.categories = [];
    this.parentCategories = [];
    this.subcategories = [];
  }
}

  async loadProducts(): Promise<void> {
    this.loadingProducts = true;
    this.cd.detectChanges();

    try {

      const records = await this.productsService.getProducts();

      // SOLO PRODUCTOS ACTIVOS
      this.products = records.filter(
        (product: any) => product.status === 'active'
      );

      this.filteredProducts = this.products;
      this.applyFilters();
    } catch (error) {

      console.error('Error cargando productos en home:', error);

      this.products = [];
      this.filteredProducts = [];

    } finally {

      this.loadingProducts = false;
      this.cd.detectChanges();

    }
  }
  getSubcategories(parentId: string): Category[] {
  return this.subcategories.filter((cat: any) => cat.parent === parentId);
}

/* filterByCategory(categoryId: string): void {
  this.selectedCategory = categoryId;
  this.selectedSubcategory = '';

  this.router.navigate(['/shop'], {
    queryParams: {
      category: categoryId
    }
  });
} */

filterBySubcategory(parentId: string, subcategoryId: string): void {
  this.selectedCategory = parentId;
  this.selectedSubcategory = subcategoryId;

  this.router.navigate(['/shop'], {
    queryParams: {
      category: parentId,
      subcategory: subcategoryId
    }
  });
}

/* applyFilters(): void {
  
  if (!this.products || this.products.length === 0) {
    this.filteredProducts = [];
    return;
  }

  if (this.selectedCategory === 'all') {
    this.filteredProducts = this.products;
    return;
  }

  this.filteredProducts = this.products.filter((product: any) => {
    const productCategories = this.getProductCategoryIds(product);
    const productSubcategories = this.getProductSubcategoryIds(product);

    const matchesCategory = productCategories.includes(this.selectedCategory);

    const matchesSubcategory = this.selectedSubcategory
      ? productSubcategories.includes(this.selectedSubcategory)
      : true;

    return matchesCategory && matchesSubcategory;
  });
} */
applyFilters(): void {
  if (!this.products || this.products.length === 0) {
    this.filteredProducts = [];
    this.currentPage = 1;
    return;
  }

  if (this.selectedCategory === 'all') {
    this.filteredProducts = this.products;
    this.currentPage = 1;
    return;
  }

  this.filteredProducts = this.products.filter((product: any) => {
    const productCategories = this.getProductCategoryIds(product);
    const productSubcategories = this.getProductSubcategoryIds(product);

    const matchesCategory = productCategories.includes(this.selectedCategory);

    const matchesSubcategory = this.selectedSubcategory
      ? productSubcategories.includes(this.selectedSubcategory)
      : true;

    return matchesCategory && matchesSubcategory;
  });

  this.currentPage = 1;
}

getProductSubcategoryIds(product: any): string[] {
  if (!product) return [];

  if (Array.isArray(product.subcategories)) {
    return product.subcategories.filter(Boolean);
  }

  if (typeof product.subcategories === 'string') {
    return [product.subcategories];
  }

  const expandedSubcategories = product.expand?.subcategories;

  if (Array.isArray(expandedSubcategories)) {
    return expandedSubcategories.map((cat: any) => cat.id).filter(Boolean);
  }

  if (expandedSubcategories?.id) {
    return [expandedSubcategories.id];
  }

  return [];
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

        // ignorar productos inactivos
        if (expandedProduct.status !== 'active') {

          this.products = this.products.filter(
            product => product.id !== expandedProduct.id
          );

          this.filteredProducts = this.filteredProducts.filter(
            product => product.id !== expandedProduct.id
          );

          this.cd.detectChanges();
          return;
        }
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
        this.currentPage = 1;
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
