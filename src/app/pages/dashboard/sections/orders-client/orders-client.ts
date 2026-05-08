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
  cardNumber: string = '';
  authorizationCode: string = '';
  transactionDate: string = '';
  paymentTypeCode: string = '';
  installmentsNumber: number = 0;
  installments: number = 0;
  
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

      if (!user?.id) {
        return;
      }

      this.orders = await this.ordersService.getOrdersByUser(user.id);

      this.orders.sort((a, b) =>
        new Date(b.created || '').getTime() -
        new Date(a.created || '').getTime()
      );

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
    const items = this.normalizeItems(order.items);

    return items.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
  }

  getNormalizedItems(order: Order): any[] {
    return this.normalizeItems(order.items);
  }

  normalizeItems(items: any): any[] {
    if (!items) return [];

    if (Array.isArray(items)) {
      return items;
    }

    try {
      const parsedItems = JSON.parse(items);
      return Array.isArray(parsedItems) ? parsedItems : [];
    } catch {
      return [];
    }
  }

  getStatusLabel(status?: string): string {
    return this.statusOptions.find(item => item.value === status)?.label || status || 'Pendiente';
  }

  getStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      pendiente_pago: 'badge-warning',
      pagado: 'badge-success',
      rechazado: 'badge-danger',
      processing: 'badge-info',
      shipped: 'badge-primary',
      completed: 'badge-dark',
      cancelled: 'badge-secondary',
    };

    return classes[status || ''] || 'badge-default';
  }

  getPaymentTypeLabel(code?: string): string {
    const methods: Record<string, string> = {
      VD: 'Tarjeta Débito',
      VN: 'Tarjeta Crédito',
      VC: 'Tarjeta Crédito en cuotas',
      SI: 'Cuotas sin interés',
      S2: '2 cuotas sin interés',
      NC: 'N cuotas sin interés',
    };

    return methods[code || ''] || 'Webpay';
  }

  getInstallments(order: Order): number {
    return (
      order.paymentData?.installments_number ||
      order.installments ||
      0
    );
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
      customer['country'],
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