import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthPocketbaseService } from '../../../../services/auth-pocketbase.service';
import { CategoriesService } from '../../../../services/CategoriesService.service';
import { ProductsService } from '../../../../services/ProductsService.service';
import { OrdersService } from '../../../../services/OrdersService.service';

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
  ordersCount = 0;
pendingOrdersCount = 0;
monthlySales = 0;
totalSales = 0;
  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private authService: AuthPocketbaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.cdr.detectChanges();
  }

  async loadStats(): Promise<void> {
  try {
    this.loading = true;

    const [products, categories, clients, orders] = await Promise.all([
      this.productsService.countProducts(),
      this.categoriesService.countCategories(),
      this.authService.countClients(),
      this.ordersService.getOrders()
    ]);

    this.productsCount = products;
    this.categoriesCount = categories;
    this.clientsCount = clients;

    this.ordersCount = orders.length;

    this.pendingOrdersCount = orders.filter((order: any) =>
      order.status === 'pending' ||
      order.status === 'pendiente_pago' ||
      order.status === 'processing'
    ).length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const paidOrders = orders.filter((order: any) =>
      order.status === 'paid' ||
      order.status === 'pagado' ||
      order.status === 'completed'
    );

    this.monthlySales = paidOrders
      .filter((order: any) => {
        const created = new Date(order.created);
        return (
          created.getMonth() === currentMonth &&
          created.getFullYear() === currentYear
        );
      })
      .reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

    this.totalSales = paidOrders
      .reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

    this.cdr.detectChanges();

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  } finally {
    this.loading = false;
  }
}
}