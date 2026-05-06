import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthPocketbaseService } from '../../../../services/auth-pocketbase.service';
import { CategoriesService } from '../../../../services/CategoriesService.service';
import { ProductsService } from '../../../../services/ProductsService.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './home-dashboard.html',
  styleUrl: './home-dashboard.css',
})
export class HomeDashboard implements OnInit {

  productsCount = 0;
  categoriesCount = 0;
  clientsCount = 0;
  loading = false;

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private authService: AuthPocketbaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.cdr.detectChanges();
  }

  async loadStats(): Promise<void> {
    try {
      this.loading = true;

      const [products, categories, clients] = await Promise.all([
        this.productsService.countProducts(),
        this.categoriesService.countCategories(),
        this.authService.countClients()
      ]);

      this.productsCount = products;
      this.categoriesCount = categories;
      this.clientsCount = clients;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      this.loading = false;
    }
  }
}