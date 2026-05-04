import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swiper from 'swiper';
import { Navigation, Thumbs, Zoom, FreeMode } from 'swiper/modules';

import { ProductsService } from '../../services/ProductsService.service';
import { Product } from '../../models/product.model';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cd = inject(ChangeDetectorRef);

  product?: Product;
  relatedProducts: Product[] = [];

  loadingProduct = false;
  loadingRelated = false;
showSharePopup = false;
showQuestionPopup = false;
  fallbackImage = 'assets/images/product-1.png';

  private productSwiper?: Swiper;
  private thumbSwiper?: Swiper;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/shop']);
      return;
    }

    await this.loadProduct(id);
    await this.loadRelatedProducts();

    setTimeout(() => {
      this.initProductSlider();
    }, 100);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initProductSlider();
    }, 300);
  }

  ngOnDestroy(): void {
    this.productSwiper?.destroy(true, true);
    this.thumbSwiper?.destroy(true, true);
  }

  async loadProduct(id: string) {
    this.loadingProduct = true;
    this.cd.detectChanges();

    try {
      this.product = await this.productsService.getProductById(id);
    } catch (error) {
      console.error('Error cargando producto:', error);
      this.product = undefined;
    } finally {
      this.loadingProduct = false;
      this.cd.detectChanges();
    }
  }

  private initProductSlider(): void {
    if (!this.product) return;

    this.productSwiper?.destroy(true, true);
    this.thumbSwiper?.destroy(true, true);

    this.thumbSwiper = new Swiper('.swiper-thumb', {
      modules: [Navigation, FreeMode],
      slidesPerView: 4,
      spaceBetween: 12,
      freeMode: true,
      watchSlidesProgress: true,
      navigation: {
        nextEl: '.thumb-next',
        prevEl: '.thumb-prev',
      },
      breakpoints: {
        0: {
          slidesPerView: 3,
        },
        768: {
          slidesPerView: 4,
        },
        1200: {
          slidesPerView: 5,
        },
      },
    });

    this.productSwiper = new Swiper('.product-swiper', {
      modules: [Navigation, Thumbs, Zoom],
      slidesPerView: 1,
      spaceBetween: 16,
      zoom: {
        maxRatio: 2.2,
      },
      thumbs: {
        swiper: this.thumbSwiper,
      },
    });
  }

  async loadRelatedProducts() {
    try {
      this.loadingRelated = true;

      const products = await this.productsService.getProducts();

      this.relatedProducts = products
        .filter((item) => item.id !== this.product?.id)
        .slice(0, 6);
    } catch (error) {
      console.error('Error cargando relacionados:', error);
    } finally {
      this.loadingRelated = false;
    }
  }

  getProductImages(product?: Product): string[] {
    if (!product) return [];

    const expandImages = (product as any).expand?.images;

    if (Array.isArray(expandImages) && expandImages.length > 0) {
      return expandImages
        .map((img: any) => this.productsService.getImageRecordUrl(img))
        .filter(Boolean) as string[];
    }

    if (Array.isArray(product.urlImages) && product.urlImages.length > 0) {
      return product.urlImages;
    }

    return [this.fallbackImage];
  }

  getFirstProductImage(product: Product): string {
    return this.getProductImages(product)[0] || this.fallbackImage;
  }

  getCategoryName(product?: Product): string {
    const expandCategories = (product as any)?.expand?.categories;

    if (Array.isArray(expandCategories) && expandCategories.length > 0) {
      return expandCategories.map((cat: any) => cat.name).join(', ');
    }

    return product?.editor || product?.unit || 'Producto';
  }

  goToProduct(product: Product): void {
    if (!product.id) return;
    this.router.navigateByUrl(`/product-detail/${product.id}`);
  }

  addToCart(product?: Product) {
    if (!product) return;
    console.log('Añadir al carrito:', product);
  }
  zoomEnabled = false;

toggleZoom(): void {
  this.zoomEnabled = !this.zoomEnabled;
}

onZoomMove(event: MouseEvent): void {
  if (!this.zoomEnabled) return;

  const container = event.currentTarget as HTMLElement;
  const image = container.querySelector('img') as HTMLImageElement;

  if (!image) return;

  const rect = container.getBoundingClientRect();

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  image.style.transformOrigin = `${x}% ${y}%`;
  image.style.transform = 'scale(2)';
}

resetZoom(event: MouseEvent): void {
  const container = event.currentTarget as HTMLElement;
  const image = container.querySelector('img') as HTMLImageElement;

  if (!image) return;

  image.style.transformOrigin = 'center center';
  image.style.transform = 'scale(1)';
}


questionForm = {
  name: '',
  email: '',
  message: '',
};

get productShareUrl(): string {
  return `${window.location.origin}/product-detail/${this.product?.id}`;
}

openSharePopup(): void {
  console.log('Abriendo popup compartir');
  this.showSharePopup = true;
  this.cd.detectChanges();
}

openQuestionPopup(): void {
  console.log('Abriendo popup pregunta');
  this.showQuestionPopup = true;
  this.cd.detectChanges();
}

closeSharePopup(): void {
  this.showSharePopup = false;
  this.cd.detectChanges();
}

closeQuestionPopup(): void {
  this.showQuestionPopup = false;
  this.cd.detectChanges();
}
async copyProductLink(): Promise<void> {
  await navigator.clipboard.writeText(this.productShareUrl);
  alert('Enlace copiado');
}

shareOn(platform: 'facebook' | 'instagram' | 'whatsapp'): void {
  const url = encodeURIComponent(this.productShareUrl);
  const text = encodeURIComponent(`Mira este producto: ${this.product?.name}`);

  const links = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    instagram: `https://www.instagram.com/?url=${url}&text=${text}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
  };

  window.open(links[platform], '_blank');
}

sendQuestion(): void {
  if (!this.product) return;

  const phone = '56912345678'; // cambia por tu WhatsApp real

  const message = `
Hola, quiero hacer una consulta sobre este producto:

Producto: ${this.product.name}
Precio: $${this.product.price}
Link: ${this.productShareUrl}

Nombre: ${this.questionForm.name}
Correo: ${this.questionForm.email}

Mensaje:
${this.questionForm.message}
  `;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

  this.closeQuestionPopup();

  this.questionForm = {
    name: '',
    email: '',
    message: '',
  };
}

}