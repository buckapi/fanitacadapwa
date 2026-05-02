import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../services/ProductsService.service';
import { Product } from '../../models/product.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  products: Product[] = [];
  loadingProducts = false;

  constructor(
    public router: Router,
    public productsService: ProductsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.listenRealtimeProducts();
  }

  ngOnDestroy(): void {
    this.productsService.unsubscribeProducts();
  }

  async loadProducts(): Promise<void> {
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
    if (!product.slug) return;

    this.router.navigate(['/product-detail', product.slug]);
  }
}
