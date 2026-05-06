import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CartItem, CartService } from '../../services/cart.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { EmailNotificationService } from '../../services/email-notification.service';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    private emailService: EmailNotificationService
  ) {
    this.checkoutForm = this.fb.group({
      rut: ['', [Validators.required]],
      country: ['Chile', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [''],
      address: ['', Validators.required],
      apartment: [''],
      phone: ['', Validators.required],
      saveInfo: [false],
      email: ['', [Validators.required, Validators.email]],
      shippingMethod: ['santiago', Validators.required],
      billingAddress: ['same', Validators.required],

      note: [''],
      terms: [false, Validators.requiredTrue]
    });

    this.cartService.items$.subscribe(items => {
      this.cartItems = items;
      this.subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
      this.calculateTotals();
    });

    this.checkoutForm.get('shippingMethod')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    const shippingMethod = this.checkoutForm.get('shippingMethod')?.value;

    if (shippingMethod === 'santiago') {
      this.shipping = 0;
    } else {
      this.shipping = 5000;
    }

    this.total = this.subtotal + this.shipping;
  }

 async completeOrder(): Promise<void> {
  if (this.checkoutForm.invalid) {
    this.checkoutForm.markAllAsTouched();
    return;
  }

  if (this.cartItems.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }

  try {
    const customer = this.checkoutForm.value;

    const orderData = {
      customer,
      items: this.cartItems,
      subtotal: this.subtotal,
      shipping: this.shipping,
      total: this.total,
      status: 'pendiente',
      customerEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`
    };

    const order = await this.ordersService.createOrder(orderData);

    const isGuest = true;

    const baseEmailPayload = {
      toEmail: customer.email,
      toName: `${customer.firstName} ${customer.lastName}`,
      templateId: 5,
      subject: 'Recibimos tu pedido en Fanaticada.cl',
      params: {
        orderId: order.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        address: customer.address,
        items: this.cartItems,
        subtotal: this.subtotal,
        shipping: this.shipping,
        total: this.total,
        isGuest,
        loginMessage: isGuest
          ? 'Te invitamos a iniciar sesión o crear una cuenta para consultar el estado de tu pedido.'
          : 'Puedes ingresar a tu cuenta para consultar el estado de tu pedido.'
      }
    };

    await firstValueFrom(this.emailService.sendOrderToClient(baseEmailPayload));

    await firstValueFrom(this.emailService.sendOrderToAdmin({
      ...baseEmailPayload,
      toEmail: 'contacto@email.com',
      toName: 'Administrador Fanaticada',
      templateId: 6,
      subject: `Nuevo pedido recibido #${order.id}`
    }));

    alert('Pedido creado correctamente. Revisa tu correo.');

    this.cartService.clear();

  } catch (error) {
    console.error('Error creando pedido:', error);
    alert('Ocurrió un error al crear el pedido.');
  }
}
}
