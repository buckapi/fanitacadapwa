import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CartItem, CartService } from '../../services/cart.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { EmailNotificationService } from '../../services/email-notification.service';
import { OrdersService } from '../../services/OrdersService.service';
import { PaymentsService } from '../../services/payments.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const chileRutValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
const value = (control.value || '')
  .toString()
  .replace(/\./g, '')
  .replace(/-/g, '')
  .toUpperCase();
  if (!value) return null;

  if (!/^\d{7,8}[0-9K]$/.test(value)) {
    return { rutInvalid: true };
  }

  const body = value.slice(0, -1);
  const dv = value.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const finalDv =
    expectedDv === 11 ? '0' :
    expectedDv === 10 ? 'K' :
    expectedDv.toString();

  return dv === finalDv ? null : { rutInvalid: true };
};
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {

  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  total = 0;

  checkoutForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public cartService: CartService,
    private ordersService: OrdersService,
    private emailService: EmailNotificationService,
    private paymentsService: PaymentsService,
    private auth: AuthPocketbaseService,
    private router: Router
  ) {

    this.checkoutForm = this.fb.group({
  rut: ['', [Validators.required, chileRutValidator]],
  country: ['Chile', Validators.required],
  firstName: ['', Validators.required],
  lastName: ['', Validators.required],
  company: [''],
  address: ['', Validators.required],
  apartment: [''],
  phone: [
    '',
    [
      Validators.required,
      Validators.pattern(/^(\+?56)?\s?9?\s?\d{8}$/)
    ]
  ],
  saveInfo: [false],
  email: ['', [Validators.required, Validators.email]],
  shippingMethod: ['santiago', Validators.required],
  billingAddress: ['same', Validators.required],
  note: [''],
  terms: [false, Validators.requiredTrue]
});

    const currentUser = this.auth.getCurrentUser?.();

    if (currentUser?.email) {
      this.checkoutForm.patchValue({
        email: currentUser.email
      });

      this.checkoutForm.get('email')?.disable();
    }

    this.cartService.items$.subscribe(items => {
      this.cartItems = items;

      this.subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      this.calculateTotals();
    });

    this.checkoutForm.get('shippingMethod')
      ?.valueChanges.subscribe(() => {
        this.calculateTotals();
      });
  }

  calculateTotals(): void {

    const shippingMethod =
      this.checkoutForm.get('shippingMethod')?.value;

    this.shipping =
      shippingMethod === 'santiago' ? 0 : 5000;

    this.total = this.subtotal + this.shipping;
  }
formatRut(event: any): void {
  let value = event.target.value || '';

  // limpiar caracteres
  value = value.replace(/[^0-9kK]/g, '').toUpperCase();

  if (value.length <= 1) {
    this.checkoutForm.get('rut')?.setValue(value, { emitEvent: false });
    return;
  }

  const body = value.slice(0, -1);
  const dv = value.slice(-1);

  // agregar puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const formattedRut = `${formattedBody}-${dv}`;

  this.checkoutForm.get('rut')?.setValue(formattedRut, {
    emitEvent: false
  });
}
  async completeOrder(): Promise<void> {
    const currentUser = this.auth.getCurrentUser?.();

    if (!currentUser?.id) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' }
      });
      return;
    }
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (this.cartItems.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    try {
      const customer = this.checkoutForm.getRawValue();
      const customerName = `${customer.firstName} ${customer.lastName}`;
      const currentUser = this.auth.getCurrentUser?.();

      const orderData = {
        customer,
        items: this.cartItems,
        subtotal: this.subtotal,
        shipping: this.shipping,
        total: this.total,
        status: 'pendiente_pago',
        customerEmail: currentUser!.email,
        customerName,
        user: currentUser!.id

      };

      const order = await this.ordersService.createOrder(orderData);

      const productsHtml = this.buildProductsHtml();

      /*  const emailPayload = {
         toEmail: customer.email,
         toName: customerName,
         templateId: 11,
         params: {
           orderId: order.id,
           customerName,
           customerEmail: customer.email,
           total: `$${this.total.toLocaleString('es-CL')}`,
           subtotal: `$${this.subtotal.toLocaleString('es-CL')}`,
           shipping: `$${this.shipping.toLocaleString('es-CL')}`,
           paymentMethod: 'Transbank',
           address: `${customer.address} ${customer.apartment || ''}`,
           phone: customer.phone,
           note: customer.note || '',
           productsHtml
         }
       }; */
      const emailPayload = {
        toEmail: customer.email,
        toName: customerName,
        templateId: 1,
        params: {
          orderId: order.id,
          customerName,
          customerEmail: customer.email,
          total: `$${this.total.toLocaleString('es-CL')}`,
          subtotal: `$${this.subtotal.toLocaleString('es-CL')}`,
          shipping: `$${this.shipping.toLocaleString('es-CL')}`,
          paymentMethod: 'Transbank',
          address: `${customer.address} ${customer.apartment || ''}`,
          phone: customer.phone,
          note: customer.note || '',

          products: this.cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            image: item.image
          })),

          productsHtml
        }
      };
      /* 
          // Notificación al cliente
          await firstValueFrom(
            this.emailService.sendCustomerPurchase(emailPayload)
          );
      
          // Notificación al administrador
          await firstValueFrom(
            this.emailService.sendAdminPurchase({
              ...emailPayload,
              toEmail: 'contacto@fanaticada.cl',
              toName: 'Fanaticada.cl',
              templateId: 2
            })
          ); */

      const payment = await this.paymentsService.createPayment({
        amount: this.total,
        orderId: order.id,
        customerEmail: customer.email,
        customerName,
        userId: 'guest'
      });

      this.paymentsService.redirectToTransbank(
        payment.url,
        payment.token
      );

    } catch (error) {
      console.error('Error iniciando pago:', error);
      alert('Ocurrió un error al iniciar el pago.');
    }
  }
  private buildProductsHtml(): string {
    return this.cartItems.map(item => {
      return `
${item.name}
Cantidad: ${item.quantity}
${item.size ? `Talla: ${item.size}` : ''}
Precio: $${item.price.toLocaleString('es-CL')}
-------------------------
`;
    }).join('');
  }
}
