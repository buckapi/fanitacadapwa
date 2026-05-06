import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import { Order } from '../../../../models/order.model';
import { OrdersService } from '../../../../services/OrdersService.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit, OnDestroy {
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
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.listenRealtimeOrders();
  }

  ngOnDestroy(): void {
    this.ordersService.unsubscribeOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading = true;

    try {
      this.orders = await this.ordersService.getOrders();
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      this.orders = [];
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async listenRealtimeOrders(): Promise<void> {
    await this.ordersService.subscribeOrders((action, record) => {
      if (action === 'create') {
        this.orders = [record, ...this.orders];
      }

      if (action === 'update') {
        this.orders = this.orders.map(order =>
          order.id === record.id ? record : order
        );

        if (this.selectedOrder?.id === record.id) {
          this.selectedOrder = record;
        }
      }

      if (action === 'delete') {
        this.orders = this.orders.filter(order => order.id !== record.id);

        if (this.selectedOrder?.id === record.id) {
          this.selectedOrder = null;
        }
      }

      this.cd.detectChanges();
    });
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
  }

  closeDetail(): void {
    this.selectedOrder = null;
  }

  async changeStatus(order: Order, event: Event): Promise<void> {
    const input = event.target as HTMLSelectElement;
    const status = input.value;

    if (!order.id) return;

    try {
      const updated = await this.ordersService.updateOrderStatus(order.id, status);

      this.orders = this.orders.map(item =>
        item.id === updated.id ? updated : item
      );

      if (this.selectedOrder?.id === updated.id) {
        this.selectedOrder = updated;
      }

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: 'La orden fue actualizada correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error('Error actualizando estado:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado de la orden.',
      });
    }
  }

  async deleteOrder(order: Order): Promise<void> {
    if (!order.id) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar orden?',
      text: `Esta acción eliminará la orden de ${order.customerName || 'cliente'}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });

    if (!result.isConfirmed) return;

    try {
      await this.ordersService.deleteOrder(order.id);

      this.orders = this.orders.filter(item => item.id !== order.id);

      Swal.fire({
        icon: 'success',
        title: 'Orden eliminada',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error('Error eliminando orden:', error);
    }
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
