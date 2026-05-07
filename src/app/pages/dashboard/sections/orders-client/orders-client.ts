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
    { value: 'pendiente_pago', label: 'Pendiente de pago' },
    { value: 'pagado', label: 'Pagada' },
    { value: 'rechazado', label: 'Rechazada' },
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

  async ngOnInit(): Promise<void> {
    await this.loadClientOrders();
  }

  async loadClientOrders(): Promise<void> {
    this.loading = true;
    this.orders = [];
    this.selectedOrder = null;

    try {
      const user = this.auth.getCurrentUser?.();

      if (!user?.email) {
        return;
      }

      /* this.orders = await this.ordersService.getOrdersByCustomerEmail(user.email); */
      this.orders = await this.ordersService.getOrdersByUser(user.id);

      if (this.orders.length > 0) {
        this.selectedOrder = this.orders[0];
      }

    } catch (error) {
      console.error('Error cargando pedidos:', error);
      this.orders = [];
    } finally {
      this.loading = false;
      this.cdRef.detectChanges();
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

  getStatusLabel(status?: string): string {
    return this.statusOptions.find(item => item.value === status)?.label || status || 'Pendiente';
  }

  getStatusClass(status?: string): string {
    return `status-${status || 'pending'}`;
  }

  getCustomerPhone(order: Order): string {
    return order.customer?.phone || 'N/A';
  }

  getCustomerAddress(order: Order): string {
    const customer = order.customer;

    if (!customer) return 'N/A';

    return [
      customer.address,
      customer['apartment'],
      customer['country']
    ].filter(Boolean).join(', ') || 'N/A';
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