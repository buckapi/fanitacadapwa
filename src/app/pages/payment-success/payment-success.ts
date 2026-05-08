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
  loading = true;
  error = '';
  orderId: string = '';
  amount: number = 0;
  status: string = 'Aprobado';
  transactionDate: string = '';
  paymentType: string = '';
  cardDetail: string = '';
  customerEmail: string = '';

  authorizationCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private cartService: CartService
  ) { }

  async ngOnInit(): Promise<void> {

    this.orderId =
      this.route.snapshot.queryParamMap.get('orderId') || '';

    if (!this.orderId) {

      this.error = 'No se encontró el número de orden.';
      this.loading = false;

      return;
    }

    try {

      this.order =
        await this.ordersService.getOrderById(this.orderId);

      if (this.order) {

        /**
         * Datos básicos
         */

        this.amount =
          this.order.total || 0;

        this.customerEmail =
          this.order.customerEmail || '';

        /**
         * Estado
         */

        this.status =
          this.order.status === 'pagado'
            ? 'Pago aprobado'
            : 'Pago rechazado';

        /**
         * Fecha transacción
         */

        this.transactionDate =
          this.order.transactionDate ||
          this.order.updated ||
          this.order.created ||
          '';

        /**
         * Método pago
         */

        this.paymentType =
          this.getPaymentTypeLabel(
            this.order.paymentTypeCode
          );

        /**
         * Últimos dígitos tarjeta
         */

        this.cardDetail =
          this.order.cardNumber || '';

        /**
         * Limpiar carrito
         */

        if (this.order.status === 'pagado') {
          this.cartService.clear();
        }

      }

    } catch (error) {

      console.error('Error cargando orden:', error);

      this.error =
        'No fue posible cargar la información del pedido.';

    } finally {

      this.loading = false;

    }

  }

  /**
   * Traducción métodos Transbank
   */

  getPaymentTypeLabel(code: string): string {

    const methods: Record<string, string> = {

      VD: 'Tarjeta Débito',

      VN: 'Tarjeta Crédito',

      VC: 'Tarjeta Crédito en cuotas',

      SI: 'Cuotas sin interés',

      S2: '2 cuotas sin interés',

      NC: 'N cuotas sin interés'

    };

    return methods[code] || 'Webpay';

  }


}
