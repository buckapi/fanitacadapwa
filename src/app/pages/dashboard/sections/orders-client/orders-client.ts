import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../../models/order.model';
import { OrdersService } from '../../../../services/OrdersService.service';
import { AuthPocketbaseService } from '../../../../services/auth-pocketbase.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orders-client',
   standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders-client.html',
  styleUrl: './orders-client.css',
})
export class OrdersClient implements OnInit {
  orders: Order[] = [];
  loading = false;
  selectedOrder: Order | null = null;

  statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'paid', label: 'Pagada' },
    { value: 'processing', label: 'En preparación' },
    { value: 'shipped', label: 'Enviada' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  constructor(
    private ordersService: OrdersService,
    private auth: AuthPocketbaseService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClientOrders();
    this.cdRef.detectChanges();
  }

  async loadClientOrders(): Promise<void> {
    this.loading = true;

    try {
      const user = this.auth.getCurrentUser?.() || null;

      if (!user) {
        this.orders = [];
        return;
      }

      if (user.id) {
        this.orders = await this.ordersService.getOrdersByUser(user.id);
      }

      if ((!this.orders || this.orders.length === 0) && user.email) {
        this.orders = await this.ordersService.getOrdersByCustomerEmail(user.email);
      }

    } catch (error) {
      console.error('Error cargando pedidos del cliente:', error);
      this.orders = [];
    } finally {
      this.loading = false;
    }
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.cdRef.detectChanges();
  }

  closeDetail(): void {
    this.selectedOrder = null;
    this.cdRef.detectChanges();
  }

  getItemsCount(order: Order): number {
    if (!Array.isArray(order.items)) return 0;

    return order.items.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(item => item.value === status)?.label || status;
  }

  getStatusClass(status: string): string {
    return `status-${status || 'pending'}`;
  }

  formatDate(date?: string): string {
    if (!date) return 'Sin fecha';

    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
