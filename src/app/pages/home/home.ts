import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../services/ProductsService.service';
import { Product } from '../../models/product.model';
import Swiper from 'swiper';
import { Autoplay, Navigation, FreeMode } from 'swiper/modules';
import { WishlistService } from '../../services/wishlist.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { CategoriesService } from '../../services/CategoriesService.service';
import { Category } from '../../models/category.model';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private swipers: Swiper[] = [];
  products: Product[] = [];
  loadingProducts = false;
featuredProducts: Product[] = [];
categories: Category[] = [];
parentCategories: Category[] = [];
loadingCategories = false;
constructor(
    public router: Router,
    public productsService: ProductsService,
    private cd: ChangeDetectorRef,
    public auth: AuthPocketbaseService,
    public wishlistService: WishlistService,
      private categoriesService: CategoriesService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.listenRealtimeProducts();
    this.loadCategories();

  }

 
ngOnDestroy(): void {
  this.destroyHomeSliders();
  this.productsService.unsubscribeProducts();
  
}
 async loadProducts(): Promise<void> {
  this.loadingProducts = true;
  this.cd.detectChanges();

  try {
    const records = await this.productsService.getProducts();

    this.products = records.filter(product => product.status === 'active');

    this.featuredProducts = this.products.filter(product =>
      product.featured === true && product.status === 'active'
    );

  } catch (error) {
    console.error('Error cargando productos en home:', error);
    this.products = [];
    this.featuredProducts = [];
  } finally {
    this.loadingProducts = false;
    this.cd.detectChanges();

    setTimeout(() => {
      this.initHomeSliders();
    }, 150);
  }
}
  
ngAfterViewInit(): void {
  setTimeout(() => {
    this.initHomeSliders();
  }, 300);
}
private initHomeSliders(): void {
  this.destroyHomeSliders();

  const textSlider = new Swiper('.text-slider-2', {
    modules: [Autoplay],
    direction: 'vertical',
    slidesPerView: 'auto',
    spaceBetween: 24,
    loop: true,
    speed: 3000,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
    },
  });

  const heroSlider = new Swiper('.hero-2-swiper', {
    modules: [Navigation, Autoplay],
    slidesPerView: 1,
    loop: true,
    speed: 900,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: '.hero-2-swiper-prev',
      prevEl: '.hero-2-swiper-next',
    },
  });

  const brandSlider = new Swiper('.brand-slider', {
    modules: [Autoplay, FreeMode],
    slidesPerView: 'auto',
    spaceBetween: 40,
    loop: true,
    speed: 4000,
    freeMode: true,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
    },
  });

  const gallerySlider = new Swiper('.gallery-slider', {
    modules: [Autoplay, FreeMode],
    slidesPerView: 'auto',
    spaceBetween: 0,
    loop: true,
    speed: 5000,
    freeMode: true,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
    },
  });
const bestProductSlider = new Swiper('.best-product-slider', {
  modules: [Autoplay, FreeMode],
  slidesPerView: 1.1,
  spaceBetween: 18,
  loop: this.featuredProducts.length > 3,
  speed: 800,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  breakpoints: {
    576: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    992: {
      slidesPerView: 3,
      spaceBetween: 24,
    },
    1400: {
      slidesPerView: 4,
      spaceBetween: 28,
    },
  },
});
  this.swipers = [textSlider, heroSlider, brandSlider, gallerySlider,bestProductSlider];
}
private destroyHomeSliders(): void {
  this.swipers.forEach((swiper) => {
    if (swiper && !swiper.destroyed) {
      swiper.destroy(true, true);
    }
  });

  this.swipers = [];
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
getCategoryImage(cat: any): string {
  const fallback = 'assets/images/category-accessories.png';

  const imageRecord = cat.expand?.image;

  if (imageRecord?.id && imageRecord?.image) {
    return `https://db.buckapi.site:8010/api/files/images/${imageRecord.id}/${imageRecord.image}`;
  }

  if (cat.id && cat.image && typeof cat.image === 'string' && cat.image.includes('.')) {
    return `https://db.buckapi.site:8010/api/files/categories/${cat.id}/${cat.image}`;
  }

  return fallback;
}


goToCategory(cat: Category): void {
  if (!cat.id) return;

  this.router.navigate(['/shop'], {
    queryParams: {
      category: cat.id
    }
  });
}
async loadCategories(): Promise<void> {
  this.loadingCategories = true;

  try {
    const records = await this.categoriesService.getCategories();

    this.categories = records || [];

    this.parentCategories = this.categories
      .filter(cat => !cat.parent && cat.active === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

  } catch (error) {
    console.error('Error cargando categorías en home:', error);
    this.categories = [];
    this.parentCategories = [];
  } finally {
    this.loadingCategories = false;
    this.cd.detectChanges();
  }
}
}
