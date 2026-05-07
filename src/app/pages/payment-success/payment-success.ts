import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../services/OrdersService.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess implements OnInit {
  order: any = null;
  orderId = '';
  amount = '';
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private cartService: CartService
  ) {}

  async ngOnInit(): Promise<void> {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') || '';
    this.amount = this.route.snapshot.queryParamMap.get('amount') || '';

    if (!this.orderId) {
      this.error = 'No se encontró el número de orden.';
      this.loading = false;
      return;
    }

    try {
      this.order = await this.ordersService.getOrderById(this.orderId);

      if (this.order?.status === 'pagado') {
        this.cartService.clear();
      }
    } catch (error) {
      console.error('Error cargando orden:', error);
      this.error = 'No fue posible cargar la información del pedido.';
    } finally {
      this.loading = false;
    }
  }
}
